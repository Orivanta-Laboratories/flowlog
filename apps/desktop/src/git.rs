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

    pub async fn poll_active_repo(
        &mut self,
        active_window_title: Option<&str>,
    ) -> Option<RepoState> {
        let mut matched: Option<RepoState> = None;
        for repo_path in &self.repos {
            let Some(mut state) = read_repo_state(repo_path).await else {
                continue;
            };

            let is_new_commit = state
                .head_commit_hash
                .as_ref()
                .map(|hash| {
                    self.last_seen_commit
                        .get(repo_path)
                        .is_some_and(|previous| previous != hash)
                })
                .unwrap_or(false);
            if let Some(hash) = &state.head_commit_hash {
                self.last_seen_commit
                    .insert(repo_path.clone(), hash.clone());
            }

            let title_mentions_repo = active_window_title
                .map(|title| title.contains(&state.repo_name))
                .unwrap_or(false);

            if title_mentions_repo {
                if matched.is_some() {
                    return None;
                }
                if !is_new_commit {
                    state.commit_subject = None;
                }
                matched = Some(state);
            }
        }
        matched
    }
}

#[cfg(test)]
mod tests {
    use super::GitWatcher;
    use std::path::PathBuf;
    use std::process::Command;

    struct TestRepo {
        path: PathBuf,
    }

    impl TestRepo {
        fn new() -> Self {
            let repo = Self {
                path: std::env::temp_dir()
                    .join(format!("flowlog-git-test-{}", uuid::Uuid::new_v4())),
            };
            std::fs::create_dir(&repo.path).expect("create test repository directory");
            for args in [
                vec!["init", "--initial-branch=main"],
                vec!["config", "user.name", "Flowlog Test"],
                vec!["config", "user.email", "test@example.invalid"],
                vec![
                    "-c",
                    "commit.gpgsign=false",
                    "commit",
                    "--allow-empty",
                    "-m",
                    "Existing setup commit",
                ],
            ] {
                let output = Command::new("git")
                    .arg("-C")
                    .arg(&repo.path)
                    .args(args)
                    .output()
                    .expect("execute local git command");
                assert!(
                    output.status.success(),
                    "git command failed: {}",
                    String::from_utf8_lossy(&output.stderr)
                );
            }
            repo
        }

        fn title(&self) -> String {
            format!(
                "signin.rs — {} — Code",
                self.path
                    .file_name()
                    .expect("repository name")
                    .to_string_lossy()
            )
        }

        fn watcher(&self) -> GitWatcher {
            GitWatcher::new(vec![self.path.clone()])
        }
    }

    impl Drop for TestRepo {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.path);
        }
    }

    #[tokio::test]
    async fn absent_window_title_never_attributes_a_watched_repository() {
        let repo = TestRepo::new();
        let mut watcher = repo.watcher();
        let first = watcher.poll_active_repo(None).await;
        let repeated = watcher.poll_active_repo(None).await;

        assert_eq!((first, repeated), (None, None));
    }

    #[tokio::test]
    async fn unrelated_window_does_not_attribute_a_freshly_observed_repository() {
        let repo = TestRepo::new();
        let mut watcher = repo.watcher();

        assert_eq!(watcher.poll_active_repo(Some("Inbox — Mail")).await, None);
    }

    #[tokio::test]
    async fn focused_repository_keeps_branch_context_without_emitting_an_existing_commit() {
        let repo = TestRepo::new();
        let mut watcher = repo.watcher();
        let title = repo.title();
        let state = watcher
            .poll_active_repo(Some(&title))
            .await
            .expect("focused repository context");

        assert_eq!(
            state.repo_name,
            repo.path.file_name().unwrap().to_string_lossy()
        );
        assert_eq!(state.branch_name.as_deref(), Some("main"));
        assert!(state.head_commit_hash.is_some());
        assert_eq!(state.commit_subject, None);
    }

    #[tokio::test]
    async fn repeated_poll_does_not_emit_the_same_commit_again() {
        let repo = TestRepo::new();
        let mut watcher = repo.watcher();
        let title = repo.title();
        watcher.poll_active_repo(Some(&title)).await;
        let repeated = watcher
            .poll_active_repo(Some(&title))
            .await
            .expect("focused repository context remains available");

        assert_eq!(repeated.commit_subject, None);
    }
}
