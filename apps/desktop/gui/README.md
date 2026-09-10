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

## Status: builds and runs

Verified with `cargo build -p flowlog-agent-gui` on Ubuntu 26.04 (Tauri
2.11.5) — compiles clean and the binary starts without crashing. Window
rendering itself hasn't been visually confirmed on a real display yet, so
still watch for surprises the first time you open it.

Linux build prerequisites (Debian/Ubuntu):

```bash
sudo apt install pkg-config libwebkit2gtk-4.1-dev libgtk-3-dev \
  libayatana-appindicator3-dev librsvg2-dev libssl-dev libxdo-dev build-essential

cargo build -p flowlog-agent-gui
```

## Running

```bash
cargo run -p flowlog-agent-gui
```

Pair first with the CLI (`flowlog-agent pair --token ... --server ...`) or
fill in the connection form in the window — both write
`~/.config/flowlog-agent/config.toml`. Without pairing, the window still
opens and shows "Not connected".

## Icons

[`icons/`](./icons) only has the PNG sizes copied over from the browser
extension's icon set, enough for `cargo run`/dev and Linux bundling. Building
installers for other platforms needs the full Tauri icon set (`.ico`,
`.icns`) — generate it from a source image with:

```bash
cargo tauri icon path/to/source-icon.png
```
