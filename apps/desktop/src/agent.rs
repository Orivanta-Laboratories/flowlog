use std::sync::{Arc, RwLock};
use std::time::Duration;

use anyhow::Result;
use serde::Serialize;
use tracing::{error, info, warn};

use crate::client::ServerClient;
use crate::config::Config;
use crate::events::RawEventPayload;
use crate::git::GitWatcher;
use crate::privacy::Exclusions;
use crate::queue::EventQueue;
use crate::window::WindowWatcher;

const EVENT_SOURCE_OS: &str = "OS";
const EVENT_SOURCE_GIT: &str = "GIT";
const MAX_EVENTS_PER_FLUSH: usize = 500;
const EXCLUSIONS_REFRESH_TICKS: u64 = 40;

/// A point-in-time view of what the agent is doing, safe to hand to a GUI.
#[derive(Debug, Clone, Serialize, Default)]
pub struct AgentStatus {
    pub paired: bool,
    pub paused: bool,
    pub is_idle: bool,
    pub active_app: Option<String>,
    pub active_window_title: Option<String>,
    pub queued_events: usize,
    pub last_flush_succeeded: Option<bool>,
    pub last_error: Option<String>,
}

/// Cheaply cloneable handle to the agent's status, shared between the
/// background tracking loop and any UI (tray icon, window) observing it.
#[derive(Clone, Default)]
pub struct SharedStatus(Arc<RwLock<AgentStatus>>);

impl SharedStatus {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn snapshot(&self) -> AgentStatus {
        self.0.read().expect("status lock poisoned").clone()
    }

    pub fn set_paired(&self, paired: bool) {
        self.update(|status| status.paired = paired);
    }

    pub fn is_paused(&self) -> bool {
        self.0.read().expect("status lock poisoned").paused
    }

    pub fn toggle_pause(&self) -> bool {
        let mut status = self.0.write().expect("status lock poisoned");
        status.paused = !status.paused;
        status.paused
    }

    pub fn update(&self, f: impl FnOnce(&mut AgentStatus)) {
        f(&mut self.0.write().expect("status lock poisoned"));
    }
}

/// Runs the tracking loop until the config disappears or the caller's
/// process shuts down. Shared by the headless CLI (`flowlog-agent run`) and
/// the GUI, which spawns this on a background task and reads `status` to
/// render itself.
pub async fn run_loop(config: Config, status: SharedStatus) -> Result<()> {
    let queue_path = Config::state_dir()?.join("queue.jsonl");
    let mut queue = EventQueue::load(queue_path).await?;

    let client = ServerClient::new(config.server_url.clone(), config.device_token.clone());
    let mut exclusions = client.fetch_exclusions().await.unwrap_or_else(|error| {
        warn!(%error, "could not fetch exclusions from server, starting with none");
        Exclusions::default()
    });

    let watcher = WindowWatcher::connect().await;
    let mut git_watcher = GitWatcher::new(config.watched_repos.clone());

    let mut ticks: u64 = 0;
    let sample_interval = Duration::from_secs(config.sample_interval_seconds);
    let flush_every_ticks = (config.flush_interval_seconds / config.sample_interval_seconds).max(1);

    status.set_paired(true);
    info!("flowlog-agent started");

    loop {
        tokio::select! {
            _ = tokio::time::sleep(sample_interval) => {}
            _ = tokio::signal::ctrl_c() => {
                info!("shutting down, flushing queued events");
                flush(&client, &mut queue, &status).await;
                return Ok(());
            }
        }

        ticks += 1;

        if status.is_paused() {
            status.update(|s| {
                s.active_app = None;
                s.active_window_title = None;
                s.is_idle = false;
            });
            continue;
        }

        let snapshot = watcher.active_window().await;
        let idle_seconds = watcher.idle_seconds().await;
        let is_idle = idle_seconds
            .map(|seconds| seconds >= config.idle_threshold_seconds)
            .unwrap_or(false);

        if exclusions.is_excluded(snapshot.app_name.as_deref(), snapshot.window_title.as_deref()) {
            continue;
        }

        if snapshot.app_name.is_none() && !is_idle {
            continue;
        }

        status.update(|s| {
            s.active_app = snapshot.app_name.clone();
            s.active_window_title = snapshot.window_title.clone();
            s.is_idle = is_idle;
        });

        let repo_state = if is_idle {
            None
        } else {
            git_watcher
                .poll_active_repo(snapshot.window_title.as_deref())
                .await
        };

        let mut os_event = RawEventPayload::new(EVENT_SOURCE_OS);
        os_event.app_name = snapshot.app_name;
        os_event.window_title = snapshot.window_title;
        os_event.is_idle = is_idle;
        if let Some(repo) = &repo_state {
            os_event.repo_name = Some(repo.repo_name.clone());
            os_event.branch_name = repo.branch_name.clone();
        }
        queue.push(os_event);

        if let Some(repo) = repo_state {
            if let Some(commit_subject) = repo.commit_subject {
                let mut git_event = RawEventPayload::new(EVENT_SOURCE_GIT);
                git_event.repo_name = Some(repo.repo_name);
                git_event.branch_name = repo.branch_name;
                git_event.commit_subject = Some(commit_subject);
                queue.push(git_event);
            }
        }

        queue.persist().await.unwrap_or_else(|error| {
            error!(%error, "failed to persist event queue to disk");
        });
        status.update(|s| s.queued_events = queue.len());

        if ticks % flush_every_ticks == 0 {
            flush(&client, &mut queue, &status).await;
        }

        if ticks % EXCLUSIONS_REFRESH_TICKS == 0 {
            match client.fetch_exclusions().await {
                Ok(refreshed) => exclusions = refreshed,
                Err(error) => warn!(%error, "could not refresh exclusions"),
            }
        }
    }
}

async fn flush(client: &ServerClient, queue: &mut EventQueue, status: &SharedStatus) {
    if queue.len() == 0 {
        return;
    }
    let batch = queue.peek_batch(MAX_EVENTS_PER_FLUSH);
    let batch_len = batch.len();
    match client.push_events(&batch).await {
        Ok(()) => {
            if let Err(error) = queue.acknowledge_sent(batch_len).await {
                error!(%error, "failed to persist queue after a successful flush");
            }
            status.update(|s| {
                s.queued_events = queue.len();
                s.last_flush_succeeded = Some(true);
                s.last_error = None;
            });
        }
        Err(error) => {
            warn!(%error, queued = queue.len(), "failed to flush events, will retry next tick");
            status.update(|s| {
                s.last_flush_succeeded = Some(false);
                s.last_error = Some(error.to_string());
            });
        }
    }
}
