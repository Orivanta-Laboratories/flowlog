use std::path::PathBuf;

use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use tracing::info;

use flowlog_agent::agent::{self, SharedStatus};
use flowlog_agent::config::Config;

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
    agent::run_loop(config, SharedStatus::new()).await
}
