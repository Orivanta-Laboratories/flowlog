import Gio from "gi://Gio";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";

const BUS_NAME = "com.orivanta.FlowlogWindowTracker";
const OBJECT_PATH = "/com/orivanta/FlowlogWindowTracker";

const INTERFACE_XML = `
<node>
  <interface name="${BUS_NAME}">
    <method name="GetFocusedWindow">
      <arg type="s" direction="out" name="title"/>
      <arg type="s" direction="out" name="wmClass"/>
    </method>
  </interface>
</node>`;

export default class FlowlogWindowTrackerExtension extends Extension {
	enable() {
		this._dbusImpl = Gio.DBusExportedObject.wrapJSObject(INTERFACE_XML, this);
		try {
			this._dbusImpl.export(Gio.DBus.session, OBJECT_PATH);
		} catch (error) {
			console.error(`Failed to export ${OBJECT_PATH}: ${error}`);
		}
		this._ownName = Gio.DBus.session.own_name(
			BUS_NAME,
			Gio.BusNameOwnerFlags.NONE,
			null,
			(name) => console.error(`Lost D-Bus name "${name}"`),
		);
	}

	disable() {
		if (this._ownName) {
			Gio.DBus.session.unown_name(this._ownName);
			this._ownName = null;
		}
		if (this._dbusImpl) {
			this._dbusImpl.unexport();
			this._dbusImpl = null;
		}
	}

	GetFocusedWindow() {
		const window = global.display.focus_window;
		if (!window) {
			return ["", ""];
		}
		return [window.get_title() ?? "", window.get_wm_class() ?? ""];
	}
}
