use tracing::debug;
use zbus::Connection;

use super::WindowSnapshot;

const SHELL_DEST: &str = "org.gnome.Shell";
const SHELL_PATH: &str = "/org/gnome/Shell";
const SHELL_INTERFACE: &str = "org.gnome.Shell";

const IDLE_MONITOR_DEST: &str = "org.gnome.Mutter.IdleMonitor";
const IDLE_MONITOR_PATH: &str = "/org/gnome/Mutter/IdleMonitor/Core";
const IDLE_MONITOR_INTERFACE: &str = "org.gnome.Mutter.IdleMonitor";

const FOCUSED_WINDOW_EVAL_SCRIPT: &str = r#"
(function () {
  const win = global.display.focus_window;
  if (!win) {
    return "";
  }
  return JSON.stringify({ title: win.get_title(), wmClass: win.get_wm_class() });
})()
"#;

pub struct GnomeShellWatcher {
    connection: Option<Connection>,
}

impl GnomeShellWatcher {
    pub async fn connect() -> Self {
        match Connection::session().await {
            Ok(connection) => Self {
                connection: Some(connection),
            },
            Err(error) => {
                debug!(%error, "could not open a D-Bus session connection");
                Self { connection: None }
            }
        }
    }

    pub async fn active_window(&self) -> Option<WindowSnapshot> {
        let connection = self.connection.as_ref()?;
        let reply: (bool, String) = connection
            .call_method(
                Some(SHELL_DEST),
                SHELL_PATH,
                Some(SHELL_INTERFACE),
                "Eval",
                &(FOCUSED_WINDOW_EVAL_SCRIPT,),
            )
            .await
            .ok()?
            .body()
            .deserialize()
            .ok()?;

        let (succeeded, payload) = reply;
        if !succeeded || payload.is_empty() {
            return None;
        }

        #[derive(serde::Deserialize)]
        struct FocusedWindow {
            title: Option<String>,
            #[serde(rename = "wmClass")]
            wm_class: Option<String>,
        }

        let focused: FocusedWindow = serde_json::from_str(&payload).ok()?;
        Some(WindowSnapshot {
            app_name: focused.wm_class,
            window_title: focused.title,
        })
    }
}

pub struct MutterIdleMonitor {
    connection: Option<Connection>,
}

impl MutterIdleMonitor {
    pub async fn connect() -> Self {
        match Connection::session().await {
            Ok(connection) => Self {
                connection: Some(connection),
            },
            Err(error) => {
                debug!(%error, "could not open a D-Bus session connection for idle monitoring");
                Self { connection: None }
            }
        }
    }

    pub async fn idle_seconds(&self) -> Option<u64> {
        let connection = self.connection.as_ref()?;
        let idle_milliseconds: u64 = connection
            .call_method(
                Some(IDLE_MONITOR_DEST),
                IDLE_MONITOR_PATH,
                Some(IDLE_MONITOR_INTERFACE),
                "GetIdletime",
                &(),
            )
            .await
            .ok()?
            .body()
            .deserialize()
            .ok()?;
        Some(idle_milliseconds / 1000)
    }
}
