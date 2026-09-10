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
`Gio.DBusExportedObject.wrapJSObject`, `Gio.DBus.session.own_name`), cross
checked against the real API surface used by this same machine's installed
`ubuntu-appindicators@ubuntu.com` extension rather than guessed from memory.
**Not yet verified by an actual enable + reload**, since that requires
logging out of the desktop session this was written on, which wasn't done
without asking first. If `GetFocusedWindow` comes back empty or the service
never appears, that's the first thing to check.
