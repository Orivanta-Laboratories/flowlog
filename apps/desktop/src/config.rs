use std::path::{Path, PathBuf};

use anyhow::{Context, Result};
use directories::ProjectDirs;
use serde::{Deserialize, Serialize};

fn default_server_url() -> String {
    "http://localhost:3000".to_string()
}

fn default_sample_interval_seconds() -> u64 {
    15
}

fn default_flush_interval_seconds() -> u64 {
    60
}

fn default_idle_threshold_seconds() -> u64 {
    120
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub device_token: String,
    #[serde(default = "default_server_url")]
    pub server_url: String,
    #[serde(default)]
    pub watched_repos: Vec<PathBuf>,
    #[serde(default = "default_sample_interval_seconds")]
    pub sample_interval_seconds: u64,
    #[serde(default = "default_flush_interval_seconds")]
    pub flush_interval_seconds: u64,
    #[serde(default = "default_idle_threshold_seconds")]
    pub idle_threshold_seconds: u64,
}

impl Config {
    pub fn config_path() -> Result<PathBuf> {
        let dirs = ProjectDirs::from("com", "orivanta", "flowlog-agent")
            .context("could not resolve a config directory for this platform")?;
        Ok(dirs.config_dir().join("config.toml"))
    }

    pub fn state_dir() -> Result<PathBuf> {
        let dirs = ProjectDirs::from("com", "orivanta", "flowlog-agent")
            .context("could not resolve a state directory for this platform")?;
        Ok(dirs.data_local_dir().to_path_buf())
    }

    pub fn load(path: &Path) -> Result<Self> {
        let raw = std::fs::read_to_string(path)
            .with_context(|| format!("reading config file at {}", path.display()))?;
        let config: Config = toml::from_str(&raw)
            .with_context(|| format!("parsing config file at {}", path.display()))?;
        Ok(config)
    }
}
