import type { QueuedEvent, StoredConfig } from "./types";

type DeviceConfigResponse = {
	excludedDomains: string[];
};

function normalizedServerUrl(serverUrl: string): string {
	return serverUrl.endsWith("/") ? serverUrl.slice(0, -1) : serverUrl;
}

export async function fetchExcludedDomains(
	config: StoredConfig,
): Promise<string[]> {
	const response = await fetch(
		`${normalizedServerUrl(config.serverUrl)}/device/v1/config`,
		{
			headers: { Authorization: `Bearer ${config.deviceToken}` },
		},
	);
	if (!response.ok) {
		throw new Error(
			`device config request failed with status ${response.status}`,
		);
	}
	const body = (await response.json()) as DeviceConfigResponse;
	return body.excludedDomains;
}

export async function pushEvents(
	config: StoredConfig,
	events: QueuedEvent[],
): Promise<void> {
	if (events.length === 0) {
		return;
	}
	const response = await fetch(
		`${normalizedServerUrl(config.serverUrl)}/device/v1/events`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${config.deviceToken}`,
			},
			body: JSON.stringify({ events }),
		},
	);
	if (!response.ok) {
		throw new Error(`event batch upload failed with status ${response.status}`);
	}
}
