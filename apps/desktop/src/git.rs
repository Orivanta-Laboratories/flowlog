use std::path::{Path, PathBuf};

use tokio::process::Command;
use tracing::debug;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RepoState {
    pub repo_name: String,
    pub branch_name: Option<String>,
    pub head_commit_hash: Option<String>,
    pub commit_subject: Option<String>,
}

fn repo_name_from_path(path: &Path) -> String {
    path.file_name()
        .map(|name| name.to_string_lossy().to_string())
        .unwrap_or_else(|| path.to_string_lossy().to_string())
}

async fn run_git(repo_path: &Path, args: &[&str]) -> Option<String> {
    let output = Command::new("git")
        .arg("-C")
        .arg(repo_path)
        .args(args)
        .output()
        .await
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let text = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if text.is_empty() {
        None
    } else {
        Some(text)
    }
}

pub async fn read_repo_state(repo_path: &Path) -> Option<RepoState> {
    if !repo_path.join(".git").exists() {
        debug!(path = %repo_path.display(), "watched path is not a git repository, skipping");
        return None;
    }

    let branch_name = run_git(repo_path, &["rev-parse", "--abbrev-ref", "HEAD"])
        .await
        .filter(|branch| branch != "HEAD");
    let head_commit_hash = run_git(repo_path, &["rev-parse", "HEAD"]).await;
    let commit_subject = run_git(repo_path, &["log", "-1", "--pretty=%s"]).await;

    Some(RepoState {
        repo_name: repo_name_from_path(repo_path),
        branch_name,
        head_commit_hash,
        commit_subject,
    })
}

pub struct GitWatcher {
    repos: Vec<PathBuf>,
    last_seen_commit: std::collections::HashMap<PathBuf, String>,
}

impl GitWatcher {
    pub fn new(repos: Vec<PathBuf>) -> Self {
        Self {
            repos,
            last_seen_commit: std::collections::HashMap::new(),
        }
    }

    pub async fn poll_active_repo(&mut self, active_window_title: Option<&str>) -> Option<RepoState> {
        let mut matched: Option<RepoState> = None;
        for repo_path in &self.repos {
            let Some(state) = read_repo_state(repo_path).await else {
                continue;
            };

            let is_new_commit = state
                .head_commit_hash
                .as_ref()
                .map(|hash| self.last_seen_commit.get(repo_path) != Some(hash))
                .unwrap_or(false);
            if let Some(hash) = &state.head_commit_hash {
                self.last_seen_commit.insert(repo_path.clone(), hash.clone());
            }

            let title_mentions_repo = active_window_title
                .map(|title| title.contains(&state.repo_name))
                .unwrap_or(false);

            if title_mentions_repo || is_new_commit {
                matched = Some(state);
            }
        }
        matched
    }
}
