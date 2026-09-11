import type { QueuedEvent, StoredConfig, StoredExclusions } from "./types";

const CONFIG_KEY = "flowlog_config";
const EXCLUSIONS_KEY = "flowlog_exclusions";
const QUEUE_KEY = "flowlog_queue";
const LAST_SNAPSHOT_KEY = "flowlog_last_snapshot";

const DEFAULT_CONFIG: StoredConfig = {
	deviceToken: "",
	paused: false,
};

export async function getConfig(): Promise<StoredConfig> {
	const stored = await chrome.storage.local.get(CONFIG_KEY);
	return {
		...DEFAULT_CONFIG,
		...(stored[CONFIG_KEY] as Partial<StoredConfig> | undefined),
	};
}

export async function setConfig(config: Partial<StoredConfig>): Promise<void> {
	const current = await getConfig();
	await chrome.storage.local.set({ [CONFIG_KEY]: { ...current, ...config } });
}

export async function getExclusions(): Promise<StoredExclusions> {
	const stored = await chrome.storage.local.get(EXCLUSIONS_KEY);
	return (
		(stored[EXCLUSIONS_KEY] as StoredExclusions | undefined) ?? { domains: [] }
	);
}

export async function setExclusions(
	exclusions: StoredExclusions,
): Promise<void> {
	await chrome.storage.local.set({ [EXCLUSIONS_KEY]: exclusions });
}

export async function getQueue(): Promise<QueuedEvent[]> {
	const stored = await chrome.storage.local.get(QUEUE_KEY);
	return (stored[QUEUE_KEY] as QueuedEvent[] | undefined) ?? [];
}

export async function pushToQueue(
	event: QueuedEvent,
	maxQueueLength: number,
): Promise<void> {
	const queue = await getQueue();
	queue.push(event);
	const trimmed =
		queue.length > maxQueueLength
			? queue.slice(queue.length - maxQueueLength)
			: queue;
	await chrome.storage.local.set({ [QUEUE_KEY]: trimmed });
}

export async function removeSentFromQueue(sentCount: number): Promise<void> {
	const queue = await getQueue();
	await chrome.storage.local.set({ [QUEUE_KEY]: queue.slice(sentCount) });
}

export async function getLastSnapshotKey(): Promise<string | null> {
	const stored = await chrome.storage.local.get(LAST_SNAPSHOT_KEY);
	return (stored[LAST_SNAPSHOT_KEY] as string | undefined) ?? null;
}

export async function setLastSnapshotKey(key: string): Promise<void> {
	await chrome.storage.local.set({ [LAST_SNAPSHOT_KEY]: key });
}
