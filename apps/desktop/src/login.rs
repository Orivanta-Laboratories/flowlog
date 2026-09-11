use std::time::Duration;

use anyhow::{bail, Context, Result};
use serde::Deserialize;
use tokio::process::Command;

use crate::config::Config;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ConnectionRequest {
    pairing_id: String,
    device_code: String,
}

#[derive(Deserialize)]
struct ConnectionStatus {
    status: String,
}

pub fn validate_service_url(value: &str) -> Result<reqwest::Url> {
    let url = reqwest::Url::parse(value).context("Invalid service URL")?;
    let local = matches!(url.host_str(), Some("localhost" | "127.0.0.1" | "[::1]"));
    if url.scheme() != "https" && !(url.scheme() == "http" && local) {
        bail!("Use HTTPS, or HTTP on localhost for development");
    }
    if !url.username().is_empty()
        || url.password().is_some()
        || url.query().is_some()
        || url.fragment().is_some()
    {
        bail!("Service URLs cannot contain credentials, queries, or fragments");
    }
    Ok(url)
}

pub async fn login(server_url: String, web_url: String) -> Result<()> {
    let server = validate_service_url(&server_url)?;
    let mut approval = validate_service_url(&web_url)?;
    let http = reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .redirect(reqwest::redirect::Policy::none())
        .build()?;
    let request: ConnectionRequest = http
        .post(server.join("/device/v1/pairing")?)
        .json(&serde_json::json!({ "platform": "LINUX" }))
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;
    uuid::Uuid::parse_str(&request.pairing_id).context("Invalid connection request")?;
    approval.set_path("/devices/connect");
    approval
        .query_pairs_mut()
        .append_pair("pairingId", &request.pairing_id);
    println!("Approve this device in your browser: {approval}");
    let _ = Command::new("xdg-open").arg(approval.as_str()).spawn();
    let deadline = tokio::time::Instant::now() + Duration::from_secs(300);
    while tokio::time::Instant::now() < deadline {
        tokio::time::sleep(Duration::from_secs(2)).await;
        let response = http
            .get(server.join(&format!("/device/v1/pairing/{}", request.pairing_id))?)
            .bearer_auth(&request.device_code)
            .send()
            .await;
        let Ok(response) = response else { continue };
        let status: ConnectionStatus = response.error_for_status()?.json().await?;
        match status.status.as_str() {
            "approved" => {
                let path = Config::config_path()?;
                let mut config = Config::load(&path).unwrap_or_else(|_| Config {
                    device_token: String::new(),
                    server_url: server_url.clone(),
                    watched_repos: Vec::new(),
                    sample_interval_seconds: 15,
                    flush_interval_seconds: 60,
                    idle_threshold_seconds: 120,
                });
                config.device_token = request.device_code;
                config.server_url = server_url.trim_end_matches('/').to_string();
                config.save(&path)?;
                return Ok(());
            }
            "pending" => {}
            _ => bail!("Connection expired. Start sign-in again."),
        }
    }
    bail!("Connection expired. Start sign-in again.")
}

#[cfg(test)]
mod tests {
    use super::validate_service_url;

    #[test]
    fn refuses_insecure_remote_and_credential_urls() {
        assert!(validate_service_url("http://example.com").is_err());
        assert!(validate_service_url("https://user:secret@example.com").is_err());
        assert!(validate_service_url("file:///tmp/data").is_err());
        assert!(validate_service_url("https://example.com").is_ok());
        assert!(validate_service_url("http://localhost:3000").is_ok());
    }
}
