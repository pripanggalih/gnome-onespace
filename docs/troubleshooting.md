# Troubleshooting

## The extension does not show up after installing

GNOME Shell only scans for new extensions at startup. Log out and log back in,
then check:

```sh
gnome-extensions list | grep onespace
gnome-extensions info onespace@pripanggalih.github.io
```

If the state is `ERROR` or `OUT OF DATE`, your GNOME Shell version is not
supported yet. Check it with `gnome-shell --version`.

## New apps do not get their own workspace

- Make sure **dynamic workspaces** are on: Settings → Multitasking →
  Workspaces → *Dynamic workspaces*.
- Make sure the app is not in the **Excluded apps** list.
- Only regular app windows are moved. Dialogs, popups and windows that skip the
  taskbar stay where they are.
- If *Group windows of the same app* is on, a second window of an app that is
  already open stays with the first one.

## Reading the logs

OneSpace runs inside GNOME Shell, so errors end up in the Shell log:

```sh
journalctl -f -o cat /usr/bin/gnome-shell
```

Reproduce the problem while this runs and include the relevant lines when you
open an issue.

## Resetting the settings

```sh
gsettings --schemadir ~/.local/share/gnome-shell/extensions/onespace@pripanggalih.github.io/schemas \
  reset-recursively org.gnome.shell.extensions.onespace
```
