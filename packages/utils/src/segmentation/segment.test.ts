import assert from "node:assert/strict";
import { test } from "node:test";

import {
	DEFAULT_SEGMENTATION_OPTIONS,
	type SegmentationEvent,
	segmentRawEvents,
} from "./segment";

const BASE_TIME = Date.parse("2026-09-10T09:00:00.000Z");

function osSample(
	offsetSeconds: number,
	overrides: Partial<Omit<SegmentationEvent, "occurredAt" | "source">> = {},
): SegmentationEvent {
	return {
		occurredAt: new Date(BASE_TIME + offsetSeconds * 1000),
		source: "OS",
		appName: "Code",
		windowTitle: "checkout.ts — acme-app",
		repoName: "acme-app",
		branchName: "feature/checkout",
		commitSubject: null,
		isIdle: false,
		...overrides,
	};
}

function samplesEvery15s(
	count: number,
	overrides: Partial<Omit<SegmentationEvent, "occurredAt" | "source">> = {},
	startOffset = 0,
) {
	return Array.from({ length: count }, (_unused, index) =>
		osSample(startOffset + index * 15, overrides),
	);
}

test("segmentRawEvents merges consecutive samples of the same activity into one session", () => {
	const sessions = segmentRawEvents(samplesEvery15s(20));

	assert.equal(sessions.length, 1);
	assert.equal(sessions[0]?.durationSeconds, 300);
	assert.equal(sessions[0]?.appName, "Code");
	assert.equal(sessions[0]?.repoName, "acme-app");
	assert.equal(sessions[0]?.branchName, "feature/checkout");
	assert.equal(
		sessions[0]?.startedAt.toISOString(),
		"2026-09-10T09:00:00.000Z",
	);
	assert.equal(sessions[0]?.endedAt.toISOString(), "2026-09-10T09:05:00.000Z");
});

test("segmentRawEvents drops activity shorter than the minimum session length", () => {
	const sessions = segmentRawEvents([
		...samplesEvery15s(20),
		...samplesEvery15s(
			2,
			{
				appName: "Slack",
				repoName: null,
				branchName: null,
				windowTitle: "Slack",
			},
			300,
		),
	]);

	assert.equal(sessions.length, 1);
	assert.equal(sessions[0]?.appName, "Code");
});

test("segmentRawEvents absorbs a short interruption between two runs of the same activity", () => {
	const sessions = segmentRawEvents([
		...samplesEvery15s(20),
		...samplesEvery15s(
			2,
			{
				appName: "Slack",
				repoName: null,
				branchName: null,
				windowTitle: "Slack",
			},
			300,
		),
		...samplesEvery15s(20, {}, 330),
	]);

	assert.equal(sessions.length, 1);
	assert.equal(sessions[0]?.durationSeconds, 630);
	assert.equal(sessions[0]?.endedAt.toISOString(), "2026-09-10T09:10:30.000Z");
});

test("segmentRawEvents splits on a branch switch", () => {
	const sessions = segmentRawEvents([
		...samplesEvery15s(20),
		...samplesEvery15s(20, { branchName: "bugfix/tax-rounding" }, 300),
	]);

	assert.equal(sessions.length, 2);
	assert.equal(sessions[0]?.branchName, "feature/checkout");
	assert.equal(sessions[1]?.branchName, "bugfix/tax-rounding");
	assert.equal(sessions[1]?.durationSeconds, 300);
});

test("segmentRawEvents ends a session at an idle stretch and starts a new one after it", () => {
	const sessions = segmentRawEvents([
		...samplesEvery15s(20),
		...samplesEvery15s(40, { isIdle: true }, 300),
		...samplesEvery15s(20, {}, 900),
	]);

	assert.equal(sessions.length, 2);
	assert.equal(sessions[0]?.endedAt.toISOString(), "2026-09-10T09:05:00.000Z");
	assert.equal(
		sessions[1]?.startedAt.toISOString(),
		"2026-09-10T09:15:00.000Z",
	);
});

test("segmentRawEvents ends a session when the agent stops reporting for longer than the gap tolerance", () => {
	const sessions = segmentRawEvents([
		...samplesEvery15s(20),
		...samplesEvery15s(20, {}, 1800),
	]);

	assert.equal(sessions.length, 2);
	assert.equal(sessions[0]?.durationSeconds, 300);
	assert.equal(
		sessions[1]?.startedAt.toISOString(),
		"2026-09-10T09:30:00.000Z",
	);
});

test("segmentRawEvents picks the window title that covered most of the session", () => {
	const sessions = segmentRawEvents([
		...samplesEvery15s(4, { windowTitle: "package.json — acme-app" }),
		...samplesEvery15s(16, { windowTitle: "checkout.ts — acme-app" }, 60),
	]);

	assert.equal(sessions.length, 1);
	assert.equal(sessions[0]?.windowTitle, "checkout.ts — acme-app");
});

test("segmentRawEvents attaches commit subjects that landed inside the session window", () => {
	const sessions = segmentRawEvents([
		...samplesEvery15s(20),
		{
			occurredAt: new Date(BASE_TIME + 120 * 1000),
			source: "GIT",
			appName: null,
			windowTitle: null,
			repoName: "acme-app",
			branchName: "feature/checkout",
			commitSubject: "Add tax rounding to checkout totals",
			isIdle: false,
		},
		{
			occurredAt: new Date(BASE_TIME + 4000 * 1000),
			source: "GIT",
			appName: null,
			windowTitle: null,
			repoName: "acme-app",
			branchName: "feature/checkout",
			commitSubject: "Unrelated later commit",
			isIdle: false,
		},
	]);

	assert.deepEqual(sessions[0]?.commitSubjects, [
		"Add tax rounding to checkout totals",
	]);
});

test("segmentRawEvents returns no sessions when every sample is idle", () => {
	assert.deepEqual(segmentRawEvents(samplesEvery15s(40, { isIdle: true })), []);
});

test("segmentRawEvents returns no sessions for an empty event list", () => {
	assert.deepEqual(segmentRawEvents([]), []);
});

test("segmentRawEvents orders unsorted input before segmenting", () => {
	const sessions = segmentRawEvents([...samplesEvery15s(20)].reverse());

	assert.equal(sessions.length, 1);
	assert.equal(
		sessions[0]?.startedAt.toISOString(),
		"2026-09-10T09:00:00.000Z",
	);
});

test("segmentRawEvents accounts for a slower browser heartbeat cadence instead of the OS 15s cap", () => {
	const heartbeats = Array.from({ length: 10 }, (_unused, index) => ({
		occurredAt: new Date(BASE_TIME + index * 60_000),
		source: "BROWSER",
		appName: "figma.com",
		windowTitle: "Acme — Checkout flow",
		repoName: null,
		branchName: null,
		commitSubject: null,
		isIdle: false,
	}));

	const sessions = segmentRawEvents(heartbeats);

	assert.equal(sessions.length, 1);
	assert.equal(sessions[0]?.durationSeconds, 600);
	assert.equal(sessions[0]?.appName, "figma.com");
});

test("segmentRawEvents keeps an OS session's tail at its own cadence when a browser session follows", () => {
	const sessions = segmentRawEvents([
		...samplesEvery15s(20),
		{
			occurredAt: new Date(BASE_TIME + 600 * 1000),
			source: "BROWSER",
			appName: "figma.com",
			windowTitle: "Acme — Checkout flow",
			repoName: null,
			branchName: null,
			commitSubject: null,
			isIdle: false,
		},
		{
			occurredAt: new Date(BASE_TIME + 660 * 1000),
			source: "BROWSER",
			appName: "figma.com",
			windowTitle: "Acme — Checkout flow",
			repoName: null,
			branchName: null,
			commitSubject: null,
			isIdle: false,
		},
	]);

	assert.equal(sessions.length, 2);
	assert.equal(sessions[0]?.durationSeconds, 300);
	assert.equal(sessions[1]?.appName, "figma.com");
	assert.equal(sessions[1]?.durationSeconds, 120);
});

test("segmentRawEvents honours a custom minimum session length", () => {
	const sessions = segmentRawEvents(samplesEvery15s(4), {
		...DEFAULT_SEGMENTATION_OPTIONS,
		minimumSessionSeconds: 30,
	});

	assert.equal(sessions.length, 1);
	assert.equal(sessions[0]?.durationSeconds, 60);
});
