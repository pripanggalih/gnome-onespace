import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

// Windows that must never be moved: desktop icons (DING) and portal dialogs.
const IGNORED_APP_IDS = new Set([
    'com.rastersoft.ding',
    'com.rastersoft.dingtest',
    'xdg-desktop-portal-gnome',
]);

export default class OneSpaceExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._tracker = Shell.WindowTracker.get_default();
        this._windowSignals = new Map(); // MetaWindow -> [signal ids]
        this._sources = new Set();

        this._createdId = global.display.connect('window-created',
            (_display, window) => this._onWindowCreated(window));

        for (const actor of global.get_window_actors())
            this._watch(actor.get_meta_window());
    }

    disable() {
        global.display.disconnect(this._createdId);
        this._createdId = null;

        for (const [window, ids] of this._windowSignals)
            ids.forEach(id => window.disconnect(id));
        this._windowSignals = null;

        this._sources.forEach(id => GLib.source_remove(id));
        this._sources = null;

        this._tracker = null;
        this._settings = null;
    }

    // --- helpers -----------------------------------------------------------

    _now() {
        return global.display.get_current_time_roundtrip();
    }

    _workspaceExists(workspace) {
        const manager = global.workspace_manager;
        for (let i = 0; i < manager.get_n_workspaces(); i++) {
            if (manager.get_workspace_by_index(i) === workspace)
                return true;
        }
        return false;
    }

    // A regular top-level app window. Only reliable once the window is shown:
    // on Wayland, type, app id and title are still unset at creation.
    _isAppWindow(window) {
        if (!window || window.is_override_redirect())
            return false;
        if (window.get_window_type() !== Meta.WindowType.NORMAL)
            return false;
        if (window.get_transient_for() || window.is_attached_dialog())
            return false;
        if (window.is_skip_taskbar() || window.is_on_all_workspaces())
            return false;
        const ids = [window.get_gtk_application_id(), window.get_wm_class()];
        if (ids.some(id => id && IGNORED_APP_IDS.has(id)))
            return false;
        return true;
    }

    _hasAppWindows(workspace) {
        return workspace.list_windows().some(w => this._isAppWindow(w));
    }

    _isExcluded(window) {
        const excluded = this._settings.get_strv('excluded-apps');
        if (excluded.length === 0)
            return false;
        const ids = [
            this._tracker.get_window_app(window)?.get_id(),
            window.get_gtk_application_id(),
            window.get_wm_class(),
        ].filter(Boolean).map(id => id.endsWith('.desktop') ? id : `${id}.desktop`);
        return ids.some(id => excluded.includes(id));
    }

    _watch(window) {
        if (!window || this._windowSignals.has(window))
            return;
        const id = window.connect('unmanaging', () => this._onUnmanaging(window));
        this._windowSignals.set(window, [id]);
    }

    // --- new windows -------------------------------------------------------

    _connectOnce(window, signal, callback) {
        const ids = this._windowSignals.get(window);
        const id = window.connect(signal, () => {
            window.disconnect(id);
            ids.splice(ids.indexOf(id), 1);
            callback();
        });
        ids.push(id);
    }

    _onWindowCreated(window) {
        if (window.is_override_redirect())
            return;
        this._watch(window);

        // On Wayland the window type, app id and parent are only known once
        // the client maps its first buffer. 'mapped' fires even when the
        // window lands on a workspace that is not visible; 'shown' does not.
        if (window.mapped)
            this._onMapped(window);
        else
            this._connectOnce(window, 'notify::mapped', () => this._onMapped(window));
    }

    _onMapped(window) {
        if (!this._isAppWindow(window) || this._isExcluded(window))
            return;

        // Not yet shown, so this takes effect at placement without a resize.
        if (this._settings.get_boolean('maximize') &&
            window.can_maximize() && !window.is_fullscreen())
            window.maximize();

        const manager = global.workspace_manager;
        if (window.get_workspace() === manager.get_active_workspace() &&
            !window.get_compositor_private()?.visible) {
            // Visible workspace: wait until it is on screen, then animate.
            // Switching earlier breaks GNOME's workspace switch animation.
            this._connectOnce(window, 'shown', () => this._moveToOwnWorkspace(window));
        } else {
            this._moveToOwnWorkspace(window);
        }
    }

    _moveToOwnWorkspace(window) {
        // Re-check: once placed it may sit on a secondary monitor (sticky).
        if (!this._isAppWindow(window) || !Meta.prefs_get_dynamic_workspaces())
            return;

        const origin = window.get_workspace();
        if (!origin)
            return;

        const others = origin.list_windows()
            .filter(w => w !== window && this._isAppWindow(w));
        if (others.length === 0)
            return;

        if (this._settings.get_boolean('group-same-app')) {
            const app = this._tracker.get_window_app(window);
            if (app && others.some(w => this._tracker.get_window_app(w) === app))
                return;
        }

        const manager = global.workspace_manager;
        const target = manager.append_new_workspace(false, this._now());

        if (origin === manager.get_active_workspace()) {
            manager.reorder_workspace(target, origin.index() + 1);
            // Same code path as Shift+Super+PageDown: animated, window follows.
            Main.wm.actionMoveWindow(window, target);
        } else {
            // Opened in the background (e.g. several apps launched at once
            // while we already switched away): queue it at the end, quietly.
            window.change_workspace(target);
        }
    }

    // --- closing windows ---------------------------------------------------

    _onUnmanaging(window) {
        this._windowSignals.get(window)?.forEach(id => window.disconnect(id));
        this._windowSignals.delete(window);

        if (!this._settings.get_boolean('leave-empty-workspace') ||
            !this._isAppWindow(window))
            return;

        const workspace = window.get_workspace();
        if (!workspace || workspace !== global.workspace_manager.get_active_workspace())
            return;

        // Let mutter finish removing the window first.
        const id = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            this._sources.delete(id);
            this._leaveIfEmpty(workspace);
            return GLib.SOURCE_REMOVE;
        });
        this._sources.add(id);
    }

    _leaveIfEmpty(workspace) {
        const manager = global.workspace_manager;
        if (!this._workspaceExists(workspace) ||
            manager.get_active_workspace() !== workspace ||
            this._hasAppWindows(workspace))
            return;

        const index = workspace.index();
        let target = null;
        if (index > 0) {
            target = manager.get_workspace_by_index(index - 1);
        } else {
            const next = manager.get_workspace_by_index(index + 1);
            if (next && this._hasAppWindows(next))
                target = next;
        }
        target?.activate(this._now());
    }
}
