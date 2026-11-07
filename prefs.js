import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class OneSpacePreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        window._settings = settings; // keep alive while the window is open

        const page = new Adw.PreferencesPage();
        window.add(page);

        // Behaviour
        const behaviour = new Adw.PreferencesGroup({title: 'Behaviour'});
        page.add(behaviour);
        const switches = [
            ['maximize', 'Maximize new windows', null],
            ['group-same-app', 'Group windows of the same app',
                'A new window joins a workspace where its app already has a window'],
            ['leave-empty-workspace', 'Leave empty workspaces',
                'When the last window closes, switch to the neighbouring workspace'],
        ];
        for (const [key, title, subtitle] of switches) {
            const row = new Adw.SwitchRow({title});
            if (subtitle)
                row.subtitle = subtitle;
            settings.bind(key, row, 'active', Gio.SettingsBindFlags.DEFAULT);
            behaviour.add(row);
        }

        // Excluded apps
        const excludedGroup = new Adw.PreferencesGroup({
            title: 'Excluded apps',
            description: 'These apps open on the current workspace and are not maximized.',
        });
        page.add(excludedGroup);

        const apps = Gio.AppInfo.get_all()
            .filter(a => a.should_show() && a.get_id())
            .sort((a, b) => a.get_display_name().localeCompare(b.get_display_name()));
        const nameOf = id => apps.find(a => a.get_id() === id)?.get_display_name() ?? id;

        const picker = new Adw.ComboRow({
            title: 'Add app',
            model: Gtk.StringList.new(apps.map(a => a.get_display_name())),
            enable_search: true,
            expression: new Gtk.PropertyExpression(Gtk.StringObject, null, 'string'),
        });
        const addButton = new Gtk.Button({
            icon_name: 'list-add-symbolic',
            valign: Gtk.Align.CENTER,
            css_classes: ['flat'],
            tooltip_text: 'Add',
        });
        addButton.connect('clicked', () => {
            const app = apps[picker.selected];
            const current = settings.get_strv('excluded-apps');
            if (app && !current.includes(app.get_id()))
                settings.set_strv('excluded-apps', [...current, app.get_id()]);
        });
        picker.add_suffix(addButton);
        excludedGroup.add(picker);

        let rows = [];
        const rebuild = () => {
            rows.forEach(r => excludedGroup.remove(r));
            rows = settings.get_strv('excluded-apps').map(id => {
                const row = new Adw.ActionRow({title: nameOf(id), subtitle: id});
                const remove = new Gtk.Button({
                    icon_name: 'user-trash-symbolic',
                    valign: Gtk.Align.CENTER,
                    css_classes: ['flat'],
                    tooltip_text: 'Remove',
                });
                remove.connect('clicked', () => settings.set_strv('excluded-apps',
                    settings.get_strv('excluded-apps').filter(x => x !== id)));
                row.add_suffix(remove);
                excludedGroup.add(row);
                return row;
            });
        };
        const changedId = settings.connect('changed::excluded-apps', rebuild);
        window.connect('close-request', () => {
            settings.disconnect(changedId);
            return false;
        });
        rebuild();
    }
}
