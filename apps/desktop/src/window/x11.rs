use tokio::process::Command;

use super::WindowSnapshot;

async fn run_xprop(args: &[&str]) -> Option<String> {
    let output = Command::new("xprop").args(args).output().await.ok()?;
    if !output.status.success() {
        return None;
    }
    Some(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

fn extract_quoted_value(line: &str) -> Option<String> {
    let start = line.find('"')? + 1;
    let end = line.rfind('"')?;
    if end <= start {
        return None;
    }
    Some(line[start..end].to_string())
}

fn extract_window_id(line: &str) -> Option<String> {
    line.split_whitespace().last().map(str::to_string)
}

pub async fn active_window() -> Option<WindowSnapshot> {
    let active_window_line = run_xprop(&["-root", "_NET_ACTIVE_WINDOW"]).await?;
    if active_window_line.contains("not found") {
        return None;
    }
    let window_id = extract_window_id(&active_window_line)?;

    let properties = run_xprop(&["-id", &window_id, "_NET_WM_NAME", "WM_NAME", "WM_CLASS"]).await?;

    let window_title = properties
        .lines()
        .find(|line| line.starts_with("_NET_WM_NAME") || line.starts_with("WM_NAME"))
        .and_then(extract_quoted_value);

    let app_name = properties
        .lines()
        .find(|line| line.starts_with("WM_CLASS"))
        .and_then(extract_quoted_value);

    if window_title.is_none() && app_name.is_none() {
        return None;
    }

    Some(WindowSnapshot {
        app_name,
        window_title,
    })
}
