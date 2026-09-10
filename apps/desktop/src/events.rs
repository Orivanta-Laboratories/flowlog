use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawEventPayload {
    pub client_event_id: String,
    pub occurred_at: DateTime<Utc>,
    pub source: String,
    pub app_name: Option<String>,
    pub window_title: Option<String>,
    pub repo_name: Option<String>,
    pub branch_name: Option<String>,
    pub commit_subject: Option<String>,
    pub is_idle: bool,
}

impl RawEventPayload {
    pub fn new(source: &str) -> Self {
        Self {
            client_event_id: Uuid::new_v4().to_string(),
            occurred_at: Utc::now(),
            source: source.to_string(),
            app_name: None,
            window_title: None,
            repo_name: None,
            branch_name: None,
            commit_subject: None,
            is_idle: false,
        }
    }
}
