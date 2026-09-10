import { fetchExcludedDomains } from "./lib/client";
import {
	getConfig,
	getExclusions,
	setConfig,
	setExclusions,
} from "./lib/storage";

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

async function loadForm(): Promise<void> {
	const config = await getConfig();
	elementById<HTMLInputElement>("server-url").value = config.serverUrl;
	elementById<HTMLInputElement>("device-token").value = config.deviceToken;
	await renderExcludedDomains();
}

async function handleSave(): Promise<void> {
	const status = elementById<HTMLParagraphElement>("status");
	const serverUrl = elementById<HTMLInputElement>("server-url").value.trim();
	const deviceToken =
		elementById<HTMLInputElement>("device-token").value.trim();

	await setConfig({ serverUrl, deviceToken });
	status.textContent = "Saved. Checking connection…";

	try {
		const domains = await fetchExcludedDomains({
			serverUrl,
			deviceToken,
			paused: false,
		});
		await setExclusions({ domains });
		await renderExcludedDomains();
		status.textContent = "Connected.";
	} catch {
		status.textContent = "Saved, but could not reach the server yet.";
	}
}

elementById<HTMLButtonElement>("save").addEventListener(
	"click",
	() => void handleSave(),
);
void loadForm();
