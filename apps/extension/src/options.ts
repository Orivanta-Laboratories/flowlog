import { fetchExcludedDomains, pollPairing, startPairing } from "./lib/client";
import { WEB_APP_URL } from "./lib/config";
import {
	getConfig,
	getExclusions,
	setConfig,
	setExclusions,
} from "./lib/storage";

const POLL_INTERVAL_MS = 2000;

function elementById<T extends HTMLElement>(id: string): T {
	const element = document.getElementById(id);
	if (element === null) {
		throw new Error(`missing #${id} element`);
	}
	return element as T;
}

async function renderExcludedDomains(): Promise<void> {
	const list = elementById<HTMLUListElement>("excluded-domains");
	const exclusions = await getExclusions();
	list.replaceChildren(
		...exclusions.domains.map((domain) => {
			const item = document.createElement("li");
			item.textContent = domain;
			return item;
		}),
	);
}

async function renderConnectionState(): Promise<void> {
	const config = await getConfig();
	elementById<HTMLParagraphElement>("connection-state").textContent =
		config.deviceToken === "" ? "Not connected." : "Connected.";
}

async function loadForm(): Promise<void> {
	await renderConnectionState();
	await renderExcludedDomains();
}

async function pollUntilApproved(
	pairingId: string,
	expiresAt: string,
	deviceCode: string,
): Promise<void> {
	const status = elementById<HTMLParagraphElement>("status");
	const deadline = new Date(expiresAt).getTime();

	while (Date.now() < deadline) {
		await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
		const result = await pollPairing(pairingId, deviceCode);
		if (result.status === "expired") break;
		if (result.status === "approved") {
			await setConfig({ deviceToken: deviceCode });
			status.textContent = "Connected. Checking your settings…";
			try {
				const domains = await fetchExcludedDomains(await getConfig());
				await setExclusions({
					domains: domains.excludedDomains,
					workSchedule: domains.workSchedule,
				});
			} catch {}
			await renderConnectionState();
			await renderExcludedDomains();
			status.textContent = "Connected.";
			return;
		}
	}
	status.textContent = "That connection link expired. Try again.";
}

async function handleConnect(): Promise<void> {
	const status = elementById<HTMLParagraphElement>("status");
	const button = elementById<HTMLButtonElement>("connect");
	button.disabled = true;
	status.textContent = "Waiting for approval in the browser tab…";

	try {
		const { pairingId, expiresAt, deviceCode } = await startPairing();
		window.open(
			`${WEB_APP_URL}/devices/connect?pairingId=${pairingId}`,
			"_blank",
			"noopener,noreferrer",
		);
		await pollUntilApproved(pairingId, expiresAt, deviceCode);
	} catch {
		status.textContent = "Could not reach the Flowlog server. Try again.";
	} finally {
		button.disabled = false;
	}
}

elementById<HTMLButtonElement>("connect").addEventListener(
	"click",
	() => void handleConnect(),
);
void loadForm();
