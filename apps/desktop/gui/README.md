# flowlog-agent-gui

Tray icon + status window for the Flowlog background agent, built with
[Tauri](https://tauri.app) around the same tracking core as the headless
`flowlog-agent` CLI (`../src/agent.rs`).

- **Tray icon**: shows the process is alive; right-click for Open Flowlog /
  Pause tracking / Quit.
- **Window**: current app + window title being tracked, queued event count,
  last sync result, a pause/resume button, and a connection settings form
  (server URL + device token) that writes the same `config.toml` the CLI's
  `pair` command writes. Closing the window hides it to the tray instead of
  quitting — use the tray menu's Quit to actually exit.

## Status: unverified build

This was written without the ability to compile it — the sandbox it was
built in has no network access to crates.io and no GTK/WebKit dev libraries
installed, so `cargo check`/`cargo build` for this crate could not be run.
Everything here compiles against the Tauri 2.x API as documented, and the
shared tracking core it depends on (`flowlog-agent`) does compile cleanly
on its own, but **you need to build this yourself before trusting it**:

```bash
# Linux build prerequisites (Debian/Ubuntu):
sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev \
  librsvg2-dev build-essential curl wget file libxdo-dev libssl-dev

cargo build -p flowlog-agent-gui
```

If it doesn't compile, the most likely culprits are a Tauri API surface
change since this was written, or a missing capability/permission for one
of the custom commands (`get_status`, `toggle_pause`, `get_config`,
`save_config`) in [`capabilities/default.json`](./capabilities/default.json) — start there.

## Running

```bash
cargo run -p flowlog-agent-gui
```

Pair first with the CLI (`flowlog-agent pair --token ... --server ...`) or
fill in the connection form in the window — both write
`~/.config/flowlog-agent/config.toml`.

## Icons

[`icons/`](./icons) only has the PNG sizes copied over from the browser
extension's icon set, enough for `cargo run`/dev and Linux bundling. Building
installers for other platforms needs the full Tauri icon set (`.ico`,
`.icns`) — generate it from a source image with:

```bash
cargo tauri icon path/to/source-icon.png
```
