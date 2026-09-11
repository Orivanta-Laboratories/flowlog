use std::path::{Path, PathBuf};

use anyhow::{ensure, Context, Result};
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
    pub fn save(&self, path: &Path) -> Result<()> {
        use std::io::Write;
        use std::os::unix::fs::{OpenOptionsExt, PermissionsExt};
        self.validate()?;
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let mut file = std::fs::OpenOptions::new()
            .write(true)
            .create(true)
            .truncate(true)
            .mode(0o600)
            .open(path)?;
        file.set_permissions(std::fs::Permissions::from_mode(0o600))?;
        file.write_all(toml::to_string_pretty(self)?.as_bytes())?;
        file.sync_all()?;
        Ok(())
    }

    pub fn validate(&self) -> Result<()> {
        ensure!(
            (1..=300).contains(&self.sample_interval_seconds),
            "Sample interval must be between 1 and 300 seconds"
        );
        ensure!(
            (1..=3600).contains(&self.flush_interval_seconds),
            "Flush interval must be between 1 and 3600 seconds"
        );
        ensure!(!self.device_token.is_empty(), "Sign in before tracking");
        crate::login::validate_service_url(&self.server_url)?;
        Ok(())
    }
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
        config.validate()?;
        Ok(config)
    }
}
