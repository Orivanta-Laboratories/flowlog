import { isWithinWorkSchedule } from "@flowlog/utils/time/shift";
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

void chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
chrome.runtime.onInstalled.addListener(scheduleAlarms);
chrome.runtime.onStartup.addListener(scheduleAlarms);

function scheduleAlarms(): void {
	chrome.alarms.create(HEARTBEAT_ALARM, { periodInMinutes: 1 });
	chrome.alarms.create(REFRESH_EXCLUSIONS_ALARM, { periodInMinutes: 1 });
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
	await refreshExclusions();
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
	if (config.paused || config.deviceToken === "") {
		return;
	}

	const idleState = await chrome.idle.queryState(IDLE_DETECTION_SECONDS);
	const focusedWindow = await chrome.windows.getLastFocused();
	const isIdle = idleState !== "active" || !focusedWindow.focused;

	const tab = await currentActiveTab();
	const domain = tab?.url ? extractDomain(tab.url) : null;
	const exclusions = await getExclusions();
	if (!isWithinWorkSchedule(new Date(), exclusions.workSchedule ?? null))
		return;
	const excluded =
		domain === null ||
		tab?.incognito === true ||
		isDomainExcluded(domain, exclusions.domains);
	if (excluded && !isIdle) {
		return;
	}

	const event: QueuedEvent = {
		clientEventId: crypto.randomUUID(),
		occurredAt: new Date().toISOString(),
		source: "BROWSER",
		appName: isIdle || excluded ? null : domain,
		windowTitle:
			isIdle || excluded ? null : (tab?.title?.slice(0, 500) ?? null),
		repoName: null,
		branchName: null,
		commitSubject: null,
		isIdle,
	};

	await pushToQueue(event, MAX_QUEUE_LENGTH);
}

async function flush(): Promise<void> {
	const config = await getConfig();
	if (config.deviceToken === "") {
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
	if (config.deviceToken === "") {
		return;
	}
	try {
		const domains = await fetchExcludedDomains(config);
		await setExclusions({
			domains: domains.excludedDomains,
			workSchedule: domains.workSchedule,
		});
	} catch {
		return;
	}
}
