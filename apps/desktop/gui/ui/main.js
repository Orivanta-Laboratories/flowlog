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
const webUrlInput = document.getElementById("web-url");
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
	} else if (status.outside_shift) {
		statusDot.dataset.state = "paused";
		statusText.textContent = "Outside working hours";
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

togglePauseButton.addEventListener("click", async () => {
	renderStatus(await invoke("toggle_pause"));
});

saveConfigButton.addEventListener("click", async () => {
	settingsStatus.textContent = "Approve this device in your browser…";
	saveConfigButton.disabled = true;
	try {
		await invoke("sign_in", {
			serverUrl: serverUrlInput.value.trim(),
			webUrl: webUrlInput.value.trim(),
		});
		settingsStatus.textContent = "Saved. Tracking will connect shortly.";
	} catch {
		settingsStatus.textContent =
			"Could not connect. Check the addresses and try again.";
	} finally {
		saveConfigButton.disabled = false;
	}
});

listen("flowlog://status-updated", (event) => renderStatus(event.payload));

refreshStatus();
