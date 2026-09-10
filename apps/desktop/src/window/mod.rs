mod gnome;
mod x11;

#[derive(Debug, Clone, Default)]
pub struct WindowSnapshot {
    pub app_name: Option<String>,
    pub window_title: Option<String>,
}

pub struct WindowWatcher {
    extension: gnome::ExtensionWindowWatcher,
    gnome: gnome::GnomeShellWatcher,
    idle: gnome::MutterIdleMonitor,
}

impl WindowWatcher {
    pub async fn connect() -> Self {
        Self {
            extension: gnome::ExtensionWindowWatcher::connect().await,
            gnome: gnome::GnomeShellWatcher::connect().await,
            idle: gnome::MutterIdleMonitor::connect().await,
        }
    }

    pub async fn active_window(&self) -> WindowSnapshot {
        if let Some(snapshot) = self.extension.active_window().await {
            return snapshot;
        }
        if let Some(snapshot) = self.gnome.active_window().await {
            return snapshot;
        }
        x11::active_window().await.unwrap_or_default()
    }

    pub async fn idle_seconds(&self) -> Option<u64> {
        self.idle.idle_seconds().await
    }
}
