# OneSpace

**One app per workspace for GNOME Shell.**

OneSpace gives every app its own workspace. Open a new app and it lands on a
fresh workspace, maximized, with the same animation as
<kbd>Shift</kbd>+<kbd>Super</kbd>+<kbd>Page Down</kbd>. Close the last window on
a workspace and you are moved to the neighbouring one, so you never stare at an
empty desktop.

Think of it as a lightweight, tiling-free way to keep one thing on screen at a
time, while still switching apps with <kbd>Super</kbd>+<kbd>Page Up</kbd>/<kbd>Page Down</kbd>,
the overview, or a touchpad swipe.

## Features

- **Own workspace per app**: new app windows move to a new workspace right
  after the current one.
- **Auto maximize**: new windows open maximized (can be turned off).
- **Leave empty workspaces**: when the last window on a workspace closes, you
  switch to the neighbouring workspace.
- **Group same app** (optional): extra windows of an app join the workspace
  where that app already lives.
- **Excluded apps**: pick apps that should open on the current workspace and
  stay unmaximized (e.g. a calculator or a color picker).
- Dialogs, popups, desktop icons and portal windows are left alone.

## Requirements

- GNOME Shell **50**
- **Dynamic workspaces** enabled (Settings → Multitasking → Workspaces →
  *Dynamic workspaces*). OneSpace does nothing with a fixed number of workspaces.

## Installation

### From a release (recommended)

1. Download `onespace@pripanggalih.github.io.shell-extension.zip` from the
   [latest release](https://github.com/pripanggalih/gnome-onespace/releases/latest).
2. Install it:

   ```sh
   gnome-extensions install --force onespace@pripanggalih.github.io.shell-extension.zip
   ```

3. Log out and log back in (on Wayland, GNOME Shell only picks up new extensions
   after a restart of the session).
4. Enable it:

   ```sh
   gnome-extensions enable onespace@pripanggalih.github.io
   ```

   or toggle **OneSpace** in the *Extensions* app.

### From source

```sh
git clone https://github.com/pripanggalih/gnome-onespace.git
cd gnome-onespace
make install
```

Then log out/in and enable it as above. You need `make`, `zip` and
`glib-compile-schemas` (package `libglib2.0-bin` on Debian/Ubuntu).

## Usage

Once enabled there is nothing to do: just open apps.

| Action | Result |
| --- | --- |
| Open an app while another app is on screen | The new app gets its own workspace and you follow it |
| Open several apps at once | Each one is queued on its own workspace at the end |
| Close the last window on a workspace | You move to the previous workspace |
| Open an excluded app | It opens on the current workspace as usual |

## Settings

Open the preferences from the *Extensions* app, or run:

```sh
gnome-extensions prefs onespace@pripanggalih.github.io
```

| Setting | Default | Description |
| --- | --- | --- |
| Maximize new windows | On | Maximize new app windows when they open |
| Group windows of the same app | Off | A new window joins a workspace where its app already has a window |
| Leave empty workspaces | On | When the last window closes, switch to the neighbouring workspace |
| Excluded apps | None | Apps that open on the current workspace and are not maximized |

Settings are also available via GSettings under
`org.gnome.shell.extensions.onespace`.

## Uninstall

```sh
gnome-extensions uninstall onespace@pripanggalih.github.io
```

## Troubleshooting

See [docs/troubleshooting.md](docs/troubleshooting.md). To report a bug,
[open an issue](https://github.com/pripanggalih/gnome-onespace/issues/new/choose).

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the
development setup and the release process.

## License

OneSpace is free software licensed under the
[GNU General Public License v2.0 or later](LICENSE).
