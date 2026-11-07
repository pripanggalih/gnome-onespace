# Contributing

Thanks for your interest in OneSpace! Bug reports, ideas and pull requests are
all welcome.

## Project layout

```
extension.js     Extension logic (runs inside GNOME Shell)
prefs.js         Preferences window (runs in a separate GTK process)
metadata.json    Extension metadata: UUID, name, supported Shell versions
schemas/         GSettings schema
Makefile         pack / install / uninstall helpers
```

## Development setup

Requirements: GNOME Shell 50, `make`, `zip`, `glib-compile-schemas`.

```sh
git clone https://github.com/pripanggalih/gnome-onespace.git
cd gnome-onespace
make install
gnome-extensions enable onespace@pripanggalih.github.io
```

### Testing changes

On Wayland, GNOME Shell cannot be restarted in place, so the quickest loop is a
nested Shell session:

```sh
make install
dbus-run-session gnome-shell --devkit --wayland
```

(On GNOME Shell older than 49 use `--nested` instead of `--devkit`.)

Inside the nested session, enable the extension and open a few apps. Watch the
logs in another terminal:

```sh
journalctl -f -o cat /usr/bin/gnome-shell
```

For the preferences window you do not need a new session:

```sh
make install && gnome-extensions prefs onespace@pripanggalih.github.io
```

### Code style

- Follow the existing style: 4-space indent, single quotes, ES modules.
- Everything connected in `enable()` must be disconnected in `disable()`, and
  every GLib source must be removed. This is required by the
  [GNOME extension review guidelines](https://gjs.guide/extensions/review-guidelines/review-guidelines.html).
- Keep changes focused; one feature or fix per pull request.

## Pull requests

1. Fork the repository and create a branch from `main`.
2. Make your change and test it in a real or nested session.
3. Add a line under **Unreleased** in [CHANGELOG.md](CHANGELOG.md).
4. Open a pull request describing what changed and how you tested it.

## Release process (maintainers)

1. Bump `"version"` in `metadata.json` (an integer, +1 per release).
2. If a new GNOME Shell version was tested, add it to `"shell-version"`.
3. Move the **Unreleased** entries in `CHANGELOG.md` to a new section
   `## [N] - YYYY-MM-DD`.
4. Commit, tag and push:

   ```sh
   git commit -am "Release vN"
   git tag vN
   git push origin main vN
   ```

5. The *Release* workflow builds the zip and publishes a GitHub release with it
   attached. The release notes come from the matching section in
   `CHANGELOG.md`.
