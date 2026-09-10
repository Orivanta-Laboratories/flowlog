#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::time::Duration;

use flowlog_agent::agent::{self, AgentStatus, SharedStatus};
use flowlog_agent::config::Config;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter, Manager, State, WindowEvent};
use tracing::{error, warn};

const STATUS_EVENT: &str = "flowlog://status-updated";
const RETRY_DELAY: Duration = Duration::from_secs(30);
const POLL_INTERVAL: Duration = Duration::from_secs(2);

#[tauri::command]
fn get_status(status: State<SharedStatus>) -> AgentStatus {
    status.snapshot()
}

#[tauri::command]
fn toggle_pause(status: State<SharedStatus>) -> AgentStatus {
    status.toggle_pause();
    status.snapshot()
}

#[tauri::command]
fn get_config() -> Option<Config> {
    let path = Config::config_path().ok()?;
    Config::load(&path).ok()
}

#[tauri::command]
fn save_config(server_url: String, device_token: String) -> Result<(), String> {
    let path = Config::config_path().map_err(|error| error.to_string())?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    let config = Config {
        device_token,
        server_url,
        watched_repos: Vec::new(),
        sample_interval_seconds: 15,
        flush_interval_seconds: 60,
        idle_threshold_seconds: 120,
    };
    let serialized = toml::to_string_pretty(&config).map_err(|error| error.to_string())?;
    std::fs::write(&path, serialized).map_err(|error| error.to_string())
}

fn spawn_agent_task(status: SharedStatus) {
    tauri::async_runtime::spawn(async move {
        loop {
            let config_path = match Config::config_path() {
                Ok(path) => path,
                Err(error) => {
                    error!(%error, "could not resolve config path, giving up");
                    return;
                }
            };

            match Config::load(&config_path) {
                Ok(config) => {
                    if let Err(error) = agent::run_loop(config, status.clone()).await {
                        error!(%error, "agent loop exited unexpectedly, retrying");
                    }
                }
                Err(_) => {
                    status.set_paired(false);
                }
            }

            tokio::time::sleep(RETRY_DELAY).await;
        }
    });
}

fn spawn_status_broadcast(app: AppHandle, status: SharedStatus) {
    tauri::async_runtime::spawn(async move {
        loop {
            if let Err(error) = app.emit(STATUS_EVENT, status.snapshot()) {
                warn!(%error, "failed to emit status update to window");
            }
            tokio::time::sleep(POLL_INTERVAL).await;
        }
    });
}

fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env().add_directive("flowlog_agent=info".parse().unwrap()))
        .init();

    let status = SharedStatus::new();

    tauri::Builder::default()
        .manage(status.clone())
        .invoke_handler(tauri::generate_handler![
            get_status,
            toggle_pause,
            get_config,
            save_config
        ])
        .setup(move |app| {
            spawn_agent_task(status.clone());
            spawn_status_broadcast(app.handle().clone(), status.clone());

            let open_item = MenuItem::with_id(app, "open", "Open Flowlog", true, None::<&str>)?;
            let pause_item =
                MenuItem::with_id(app, "toggle_pause", "Pause tracking", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit Flowlog", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open_item, &pause_item, &quit_item])?;

            let tray_status = status.clone();
            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(move |app, event| match event.id.as_ref() {
                    "toggle_pause" => {
                        tray_status.toggle_pause();
                        let _ = app.emit(STATUS_EVENT, tray_status.snapshot());
                    }
                    "open" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running flowlog-agent-gui");
}
