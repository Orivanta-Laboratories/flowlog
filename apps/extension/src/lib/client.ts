import { SERVER_URL } from "./config";
import type { PairingStatusResponse, QueuedEvent, StoredConfig } from "./types";

type DeviceConfigResponse = {
	excludedDomains: string[];
	workSchedule: import("@flowlog/utils/time/shift").WorkSchedule | null;
};

export async function fetchExcludedDomains(
	config: StoredConfig,
): Promise<DeviceConfigResponse> {
	const response = await fetch(`${SERVER_URL}/device/v1/config`, {
		headers: { Authorization: `Bearer ${config.deviceToken}` },
	});
	if (!response.ok) {
		throw new Error(
			`device config request failed with status ${response.status}`,
		);
	}
	const body = (await response.json()) as DeviceConfigResponse;
	return body;
}

export async function pushEvents(
	config: StoredConfig,
	events: QueuedEvent[],
): Promise<void> {
	if (events.length === 0) {
		return;
	}
	const response = await fetch(`${SERVER_URL}/device/v1/events`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${config.deviceToken}`,
		},
		body: JSON.stringify({ events }),
	});
	if (!response.ok) {
		throw new Error(`event batch upload failed with status ${response.status}`);
	}
}

export async function startPairing(): Promise<{
	pairingId: string;
	expiresAt: string;
	deviceCode: string;
}> {
	const response = await fetch(`${SERVER_URL}/device/v1/pairing`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ platform: "CHROME_EXTENSION" }),
	});
	if (!response.ok) {
		throw new Error(`pairing request failed with status ${response.status}`);
	}
	return response.json();
}

export async function pollPairing(
	pairingId: string,
	deviceCode: string,
): Promise<PairingStatusResponse> {
	const response = await fetch(`${SERVER_URL}/device/v1/pairing/${pairingId}`, {
		headers: { Authorization: `Bearer ${deviceCode}` },
		cache: "no-store",
	});
	if (!response.ok) {
		throw new Error(
			`pairing status request failed with status ${response.status}`,
		);
	}
	return response.json();
}
