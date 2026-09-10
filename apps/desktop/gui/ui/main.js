const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;

const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");
const currentApp = document.getElementById("current-app");
const currentTitle = document.getElementById("current-title");
const queuedCount = document.getElementById("queued-count");
const lastSync = document.getElementById("last-sync");
const togglePauseButton = document.getElementById("toggle-pause");
const settingsCard = document.getElementById("settings-card");
const serverUrlInput = document.getElementById("server-url");
const deviceTokenInput = document.getElementById("device-token");
const saveConfigButton = document.getElementById("save-config");
const settingsStatus = document.getElementById("settings-status");

let hasSetInitialSettingsOpenState = false;

function renderStatus(status) {
	if (!hasSetInitialSettingsOpenState) {
		settingsCard.open = !status.paired;
		hasSetInitialSettingsOpenState = true;
	}

	if (!status.paired) {
		statusDot.dataset.state = "unpaired";
		statusText.textContent = "Not connected";
	} else if (status.paused) {
		statusDot.dataset.state = "paused";
		statusText.textContent = "Paused";
	} else {
		statusDot.dataset.state = "tracking";
		statusText.textContent = "Tracking";
	}

	togglePauseButton.textContent = status.paused
		? "Resume tracking"
		: "Pause tracking";
	togglePauseButton.disabled = !status.paired;

	if (status.is_idle) {
		currentApp.textContent = "Idle";
		currentTitle.textContent = "";
	} else {
		currentApp.textContent = status.active_app ?? "—";
		currentTitle.textContent = status.active_window_title ?? "";
	}

	queuedCount.textContent = String(status.queued_events);

	if (status.last_flush_succeeded === true) {
		lastSync.textContent = "Just now";
	} else if (status.last_flush_succeeded === false) {
		lastSync.textContent = status.last_error
			? `Failed: ${status.last_error}`
			: "Failed";
	} else {
		lastSync.textContent = "—";
	}
}

async function refreshStatus() {
	renderStatus(await invoke("get_status"));
}

async function loadConfig() {
	const config = await invoke("get_config");
	if (config) {
		serverUrlInput.value = config.server_url;
		deviceTokenInput.value = config.device_token;
	}
}

togglePauseButton.addEventListener("click", async () => {
	renderStatus(await invoke("toggle_pause"));
});

saveConfigButton.addEventListener("click", async () => {
	settingsStatus.textContent = "Saving…";
	try {
		await invoke("save_config", {
			serverUrl: serverUrlInput.value.trim(),
			deviceToken: deviceTokenInput.value.trim(),
		});
		settingsStatus.textContent = "Saved. Tracking will connect shortly.";
	} catch (error) {
		settingsStatus.textContent = `Could not save: ${error}`;
	}
});

listen("flowlog://status-updated", (event) => renderStatus(event.payload));

refreshStatus();
loadConfig();
