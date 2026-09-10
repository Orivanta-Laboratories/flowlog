mod client;
mod config;
mod events;
mod git;
mod privacy;
mod queue;
mod window;

use std::path::PathBuf;
use std::time::Duration;

use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use tracing::{error, info, warn};

use client::ServerClient;
use config::Config;
use events::RawEventPayload;
use git::GitWatcher;
use privacy::Exclusions;
use queue::EventQueue;
use window::WindowWatcher;

const EVENT_SOURCE_OS: &str = "OS";
const EVENT_SOURCE_GIT: &str = "GIT";
const MAX_EVENTS_PER_FLUSH: usize = 500;
const EXCLUSIONS_REFRESH_TICKS: u64 = 40;

#[derive(Parser)]
#[command(name = "flowlog-agent", version, about = "Flowlog background tracking agent")]
struct Cli {
    #[command(subcommand)]
    command: Option<CliCommand>,
}

#[derive(Subcommand)]
enum CliCommand {
    Run,
    Pair {
        #[arg(long)]
        token: String,
        #[arg(long, default_value = "http://localhost:3000")]
        server: String,
    },
    Watch {
        path: PathBuf,
    },
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env().add_directive("flowlog_agent=info".parse()?))
        .init();

    let cli = Cli::parse();
    match cli.command.unwrap_or(CliCommand::Run) {
        CliCommand::Run => run().await,
        CliCommand::Pair { token, server } => pair(token, server).await,
        CliCommand::Watch { path } => watch(path).await,
    }
}

async fn pair(token: String, server: String) -> Result<()> {
    let path = Config::config_path()?;
    if let Some(parent) = path.parent() {
        tokio::fs::create_dir_all(parent).await?;
    }
    let config = Config {
        device_token: token,
        server_url: server,
        watched_repos: Vec::new(),
        sample_interval_seconds: 15,
        flush_interval_seconds: 60,
        idle_threshold_seconds: 120,
    };
    let serialized = toml::to_string_pretty(&config)?;
    tokio::fs::write(&path, serialized).await?;
    info!(path = %path.display(), "device paired, config written");
    Ok(())
}

async fn watch(path: PathBuf) -> Result<()> {
    let config_path = Config::config_path()?;
    let mut config = Config::load(&config_path)
        .context("run `flowlog-agent pair --token <TOKEN>` first")?;
    let absolute = path.canonicalize().unwrap_or(path);
    if !config.watched_repos.contains(&absolute) {
        config.watched_repos.push(absolute.clone());
    }
    tokio::fs::write(&config_path, toml::to_string_pretty(&config)?).await?;
    info!(path = %absolute.display(), "repository added to watch list");
    Ok(())
}

async fn run() -> Result<()> {
    let config_path = Config::config_path()?;
    let config = Config::load(&config_path)
        .context("run `flowlog-agent pair --token <TOKEN>` first")?;

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

    info!("flowlog-agent started");

    loop {
        tokio::select! {
            _ = tokio::time::sleep(sample_interval) => {}
            _ = tokio::signal::ctrl_c() => {
                info!("shutting down, flushing queued events");
                flush(&client, &mut queue).await;
                return Ok(());
            }
        }

        ticks += 1;

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

        if ticks % flush_every_ticks == 0 {
            flush(&client, &mut queue).await;
        }

        if ticks % EXCLUSIONS_REFRESH_TICKS == 0 {
            match client.fetch_exclusions().await {
                Ok(refreshed) => exclusions = refreshed,
                Err(error) => warn!(%error, "could not refresh exclusions"),
            }
        }
    }
}

async fn flush(client: &ServerClient, queue: &mut EventQueue) {
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
        }
        Err(error) => {
            warn!(%error, queued = queue.len(), "failed to flush events, will retry next tick");
        }
    }
}
