import { getConfig, setConfig } from "./lib/storage";

function elementById<T extends HTMLElement>(id: string): T {
	const element = document.getElementById(id);
	if (element === null) {
		throw new Error(`missing #${id} element`);
	}
	return element as T;
}

async function render(): Promise<void> {
	const config = await getConfig();
	const dot = elementById<HTMLSpanElement>("status-dot");
	const text = elementById<HTMLSpanElement>("status-text");
	const toggle = elementById<HTMLButtonElement>("toggle-pause");

	if (config.deviceToken === "" || config.serverUrl === "") {
		dot.className = "dot";
		text.textContent = "Not connected";
		toggle.style.display = "none";
		return;
	}

	toggle.style.display = "block";
	if (config.paused) {
		dot.className = "dot paused";
		text.textContent = "Paused";
		toggle.textContent = "Resume tracking";
	} else {
		dot.className = "dot active";
		text.textContent = "Tracking";
		toggle.textContent = "Pause tracking";
	}
}

async function handleTogglePause(): Promise<void> {
	const config = await getConfig();
	await setConfig({ paused: !config.paused });
	await render();
}

elementById<HTMLButtonElement>("toggle-pause").addEventListener(
	"click",
	() => void handleTogglePause(),
);
void render();
