use crate::schedule::WorkSchedule;
use anyhow::{bail, Context, Result};
use serde::Deserialize;
use tracing::warn;

use crate::events::RawEventPayload;
use crate::privacy::Exclusions;

pub struct ServerClient {
    http: reqwest::Client,
    server_url: String,
    device_token: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DeviceConfigResponse {
    excluded_app_names: Vec<String>,
    excluded_title_patterns: Vec<String>,
    work_schedule: Option<WorkSchedule>,
}

impl ServerClient {
    pub fn new(server_url: String, device_token: String) -> Self {
        Self {
            http: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(15))
                .redirect(reqwest::redirect::Policy::none())
                .build()
                .expect("valid HTTP client configuration"),
            server_url,
            device_token,
        }
    }

    pub async fn fetch_exclusions(&self) -> Result<(Exclusions, Option<WorkSchedule>)> {
        let response = self
            .http
            .get(format!("{}/device/v1/config", self.server_url))
            .bearer_auth(&self.device_token)
            .send()
            .await
            .context("requesting device config")?;

        if !response.status().is_success() {
            bail!(
                "device config request failed with status {}",
                response.status()
            );
        }

        let config: DeviceConfigResponse = response
            .json()
            .await
            .context("parsing device config response")?;

        Ok((
            Exclusions {
                app_names: config.excluded_app_names,
                title_patterns: config.excluded_title_patterns,
            },
            config.work_schedule,
        ))
    }

    pub async fn push_events(&self, events: &[RawEventPayload]) -> Result<()> {
        if events.is_empty() {
            return Ok(());
        }

        let response = self
            .http
            .post(format!("{}/device/v1/events", self.server_url))
            .bearer_auth(&self.device_token)
            .json(&serde_json::json!({ "events": events }))
            .send()
            .await
            .context("sending events to server")?;

        if !response.status().is_success() {
            let status = response.status();
            warn!(%status, "server rejected the event batch");
            bail!("server rejected event batch with status {status}");
        }

        Ok(())
    }
}
