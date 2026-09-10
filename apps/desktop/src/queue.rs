use std::collections::VecDeque;
use std::path::PathBuf;

use anyhow::{Context, Result};
use tokio::fs;
use tracing::warn;

use crate::events::RawEventPayload;

const MAX_QUEUED_EVENTS: usize = 20_000;

pub struct EventQueue {
    path: PathBuf,
    pending: VecDeque<RawEventPayload>,
}

impl EventQueue {
    pub async fn load(path: PathBuf) -> Result<Self> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)
                .await
                .with_context(|| format!("creating queue directory {}", parent.display()))?;
        }

        let mut pending = VecDeque::new();
        if let Ok(contents) = fs::read_to_string(&path).await {
            for line in contents.lines() {
                if line.trim().is_empty() {
                    continue;
                }
                match serde_json::from_str::<RawEventPayload>(line) {
                    Ok(event) => pending.push_back(event),
                    Err(error) => warn!(%error, "dropping unreadable queued event"),
                }
            }
        }

        Ok(Self { path, pending })
    }

    pub fn push(&mut self, event: RawEventPayload) {
        if self.pending.len() >= MAX_QUEUED_EVENTS {
            self.pending.pop_front();
        }
        self.pending.push_back(event);
    }

    pub fn len(&self) -> usize {
        self.pending.len()
    }

    pub fn peek_batch(&self, max: usize) -> Vec<RawEventPayload> {
        self.pending.iter().take(max).cloned().collect()
    }

    pub async fn acknowledge_sent(&mut self, sent_count: usize) -> Result<()> {
        for _ in 0..sent_count {
            self.pending.pop_front();
        }
        self.persist().await
    }

    pub async fn persist(&self) -> Result<()> {
        let mut buffer = String::new();
        for event in &self.pending {
            buffer.push_str(&serde_json::to_string(event)?);
            buffer.push('\n');
        }
        fs::write(&self.path, buffer)
            .await
            .with_context(|| format!("writing queue file {}", self.path.display()))
    }
}
