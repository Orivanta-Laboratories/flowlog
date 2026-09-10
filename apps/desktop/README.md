# flowlog-agent

Background Linux agent for Flowlog. Tracks the focused window, idle time, and
git branch/commit activity, and syncs it to the Flowlog server so the web app
can turn it into a suggested timesheet.

This is a Cargo workspace with two binaries built from the same tracking
core (`src/agent.rs`):

- **`flowlog-agent`** (this directory) — the headless CLI/daemon, meant to
  run as a systemd `--user` service. No visible UI; status only shows up in
  logs.
- **`gui`** ([`gui/`](./gui)) — a tray icon + status window built with
  [Tauri](https://tauri.app), for anyone who wants to see tracking status
  and pause/resume without a terminal. See [`gui/README.md`](./gui/README.md).

Pick one, not both — running the CLI service and the GUI at the same time
means two processes racing to flush the same queue file.

## Building the CLI

```bash
cargo build --release -p flowlog-agent
```

The binary is written to `target/release/flowlog-agent`.

## Pairing

1. In the Flowlog web app, go to **Settings → Devices** and create a device,
   copying the token shown (shown once).
2. Run:

   ```bash
   flowlog-agent pair --token <TOKEN> --server https://your-flowlog-server
   ```

   This writes `~/.config/flowlog-agent/config.toml`. The GUI reads and
   writes the same file, so pairing with the CLI is enough for either.
3. Tell the agent which local git repositories to watch:

   ```bash
   flowlog-agent watch ~/code/my-project
   ```

4. Start it: `flowlog-agent run`. On most Linux setups you'll want this run
   as a systemd `--user` service so it starts on login — see
   [`flowlog-agent.service`](./flowlog-agent.service). Or, if you'd rather
   have a tray icon and a window, use the GUI instead (see below).

## How window detection works

- **GNOME (X11 or Wayland):** the agent asks `org.gnome.Shell`'s `Eval` D-Bus
  method for `global.display.focus_window`'s title and window class. GNOME
  disables `Eval` by default outside of Looking Glass/dev-tools mode; enable
  it once with:

  ```bash
  gsettings set org.gnome.shell development-tools true
  ```

  Idle time comes from `org.gnome.Mutter.IdleMonitor`, which works without
  any extra setup.
- **X11 (any window manager, or XWayland fallback):** falls back to
  `_NET_ACTIVE_WINDOW` / `_NET_WM_NAME` / `WM_CLASS` via `xprop`. This only
  sees X11 (or XWayland-backed) windows — native-Wayland windows outside
  GNOME's `Eval` path are invisible to it. KDE/wlroots support (via the
  foreign-toplevel Wayland protocol) is tracked for a future release.
- If neither path resolves a window and the session isn't idle, no event is
  recorded for that tick rather than guessing.

## Privacy

- Exclusion lists (app names, window-title patterns) are pulled from your
  account settings and applied **before** anything is queued — excluded
  activity never touches disk or the network.
- Only structured metadata is ever sent: app name, window title, repo name,
  branch name, commit subject, idle flag. No keystrokes, no screenshots, no
  file contents.
- Events are queued to `~/.local/share/flowlog-agent/queue.jsonl` until
  successfully delivered, so a flaky connection doesn't lose data; nothing
  else reads that file.
