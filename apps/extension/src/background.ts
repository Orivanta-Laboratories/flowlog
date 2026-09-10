import { fetchExcludedDomains, pushEvents } from "./lib/client";
import { extractDomain, isDomainExcluded } from "./lib/domain";
import {
	getConfig,
	getExclusions,
	getQueue,
	pushToQueue,
	removeSentFromQueue,
	setExclusions,
} from "./lib/storage";
import type { QueuedEvent } from "./lib/types";

const HEARTBEAT_ALARM = "flowlog-heartbeat";
const REFRESH_EXCLUSIONS_ALARM = "flowlog-refresh-exclusions";
const MAX_QUEUE_LENGTH = 5000;
const MAX_EVENTS_PER_FLUSH = 500;
const IDLE_DETECTION_SECONDS = 120;

chrome.runtime.onInstalled.addListener(scheduleAlarms);
chrome.runtime.onStartup.addListener(scheduleAlarms);

function scheduleAlarms(): void {
	chrome.alarms.create(HEARTBEAT_ALARM, { periodInMinutes: 1 });
	chrome.alarms.create(REFRESH_EXCLUSIONS_ALARM, { periodInMinutes: 10 });
	chrome.idle.setDetectionInterval(IDLE_DETECTION_SECONDS);
}

chrome.alarms.onAlarm.addListener((alarm) => {
	if (alarm.name === HEARTBEAT_ALARM) {
		void handleHeartbeat();
	}
	if (alarm.name === REFRESH_EXCLUSIONS_ALARM) {
		void refreshExclusions();
	}
});

chrome.tabs.onActivated.addListener(() => void captureAndQueue());
chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
	if (changeInfo.status === "complete" || changeInfo.title !== undefined) {
		void captureAndQueue();
	}
});
chrome.windows.onFocusChanged.addListener(() => void captureAndQueue());
chrome.idle.onStateChanged.addListener(() => void captureAndQueue());

async function handleHeartbeat(): Promise<void> {
	await captureAndQueue();
	await flush();
}

async function currentActiveTab(): Promise<chrome.tabs.Tab | null> {
	const [tab] = await chrome.tabs.query({
		active: true,
		lastFocusedWindow: true,
	});
	return tab ?? null;
}

async function captureAndQueue(): Promise<void> {
	const config = await getConfig();
	if (config.paused || config.deviceToken === "" || config.serverUrl === "") {
		return;
	}

	const idleState = await chrome.idle.queryState(IDLE_DETECTION_SECONDS);
	const isIdle = idleState !== "active";

	const tab = await currentActiveTab();
	const domain = tab?.url ? extractDomain(tab.url) : null;
	if (domain === null) {
		return;
	}

	const exclusions = await getExclusions();
	if (isDomainExcluded(domain, exclusions.domains)) {
		return;
	}

	const event: QueuedEvent = {
		clientEventId: crypto.randomUUID(),
		occurredAt: new Date().toISOString(),
		source: "BROWSER",
		appName: domain,
		windowTitle: tab?.title ?? null,
		repoName: null,
		branchName: null,
		commitSubject: null,
		isIdle,
	};

	await pushToQueue(event, MAX_QUEUE_LENGTH);
}

async function flush(): Promise<void> {
	const config = await getConfig();
	if (config.deviceToken === "" || config.serverUrl === "") {
		return;
	}

	const queue = await getQueue();
	if (queue.length === 0) {
		return;
	}

	const batch = queue.slice(0, MAX_EVENTS_PER_FLUSH);
	try {
		await pushEvents(config, batch);
		await removeSentFromQueue(batch.length);
	} catch {
		return;
	}
}

async function refreshExclusions(): Promise<void> {
	const config = await getConfig();
	if (config.deviceToken === "" || config.serverUrl === "") {
		return;
	}
	try {
		const domains = await fetchExcludedDomains(config);
		await setExclusions({ domains });
	} catch {
		return;
	}
}
