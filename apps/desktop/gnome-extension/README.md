# flowlog-window-tracker

A GNOME Shell extension that exposes the focused window's title and app id
over a local, session-only D-Bus service
(`com.orivanta.FlowlogWindowTracker`), so the Flowlog desktop agent can read
it. This exists because GNOME deliberately blocks the two APIs an ordinary
process would otherwise use for this (`org.gnome.Shell.Eval`, which needs
unsafe mode; `org.gnome.Shell.Introspect.GetRunningApplications`, which is
restricted to Flatpak-sandboxed apps) — those restrictions are a genuine
GNOME/Wayland security boundary, not a bug. Code running inside the Shell
itself, like this extension, isn't subject to either restriction, which is
exactly why installing it is an explicit, visible step: it's the consent
boundary.

This extension does nothing except answer "what window is focused right
now" over D-Bus. It makes no network calls and stores nothing.

## Install (manual, until this is published on extensions.gnome.org)

```bash
mkdir -p ~/.local/share/gnome-shell/extensions/flowlog-window-tracker@orivanta.com
cp apps/desktop/gnome-extension/*.json apps/desktop/gnome-extension/*.js \
  ~/.local/share/gnome-shell/extensions/flowlog-window-tracker@orivanta.com/
```

Then, **on Wayland, log out and back in** (Wayland only reloads extensions
on session start — there is no "Restart Shell" shortcut like X11's Alt+F2
"r"). On X11 you can instead run `busctl --user call org.gnome.Shell
/org/gnome/Shell org.gnome.Shell Eval s 'Meta.restart("Restarting…")'` or
just log out and back in there too.

Finally, enable it:

```bash
gnome-extensions enable flowlog-window-tracker@orivanta.com
```

Verify it's live:

```bash
gdbus call --session --dest com.orivanta.FlowlogWindowTracker \
  --object-path /com/orivanta/FlowlogWindowTracker \
  --method com.orivanta.FlowlogWindowTracker.GetFocusedWindow
```

Should print something like `('Terminal', 'gnome-terminal-server')` instead
of a `ServiceUnknown` D-Bus error.

## Status

Written against GNOME Shell 50's extension API (`Extension` base class from
`resource:///org/gnome/shell/extensions/extension.js`,
`Gio.DBusExportedObject.wrapJSObject`, `Gio.DBus.session.own_name`,
`global.display.focus_window`, `get_wm_class()`), cross checked against the
real, currently-running D-Bus-exporting extensions on this machine —
`snapd-prompting@canonical.com`'s `dbusServer.js` for the export/own-name
shape, and `ubuntu-dock@ubuntu.com`'s `docking.js`/`intellihide.js` for
`focus_window`/`get_wm_class()` — rather than guessed from memory or stale
docs.

`metadata.json`'s `shell-version` previously listed only `["45"..."48"]`; on
this GNOME Shell 50.1 machine that's enough for the Shell to silently never
register the extension at all. Confirmed via `busctl --user call
org.gnome.Shell.Extensions … GetExtensionInfo` returning an empty dict and
`ListExtensions` omitting the UUID entirely, even after copying the files in.
Fixed by adding `"49"` and `"50"` (matching what every other real extension
installed on this machine declares).

`gjs -m extension.js` confirms the file parses as a valid ES module (it
fails only on resolving `resource:///org/gnome/shell/...`, which doesn't
exist outside a running Shell process — expected, not a syntax error).

**Still not verified by an actual enable + reload.** On this GNOME Shell
50.1 build there is no way to get the Shell to notice a newly-installed
extension short of a full session logout/login — confirmed directly, not
assumed:

- `GetExtensionInfo("flowlog-window-tracker@orivanta.com")` → empty `a{sv}`
- `ListExtensions()` → does not include the UUID
- `EnableExtension("flowlog-window-tracker@orivanta.com")` → `false`
- `ReloadExtension(...)` → `Method ReloadExtension is not implemented`, and
  this is true for *any* UUID, including already-loaded extensions, so it's
  a dead end on this GNOME version generally, not specific to this extension

If `GetFocusedWindow` comes back empty or the service never appears after
logging back in, that's the first thing to check next — but the code and
metadata issues found during this pass are fixed.
