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

test("segmentRawEvents keeps work on either side of an unrelated interruption separate", () => {
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

	assert.deepEqual(
		sessions.map((session) => ({
			appName: session.appName,
			durationSeconds: session.durationSeconds,
			start: (session.startedAt.getTime() - BASE_TIME) / 1000,
			end: (session.endedAt.getTime() - BASE_TIME) / 1000,
		})),
		[
			{ appName: "Code", durationSeconds: 300, start: 0, end: 300 },
			{ appName: "Code", durationSeconds: 300, start: 330, end: 630 },
		],
	);
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

for (const appName of ["Code", null]) {
	test(`segmentRawEvents preserves a short idle boundary with appName ${appName}`, () => {
		const sessions = segmentRawEvents([
			...samplesEvery15s(20),
			osSample(295, { isIdle: true, appName }),
			...samplesEvery15s(20, {}, 315),
		]);

		assert.deepEqual(
			sessions.map((session) => [
				(session.startedAt.getTime() - BASE_TIME) / 1000,
				(session.endedAt.getTime() - BASE_TIME) / 1000,
				session.durationSeconds,
			]),
			[
				[0, 295, 295],
				[315, 615, 300],
			],
		);
	});
}

test("segmentRawEvents leaves a missing heartbeat interval unbilled even below the gap tolerance", () => {
	const sessions = segmentRawEvents([
		...samplesEvery15s(20),
		...samplesEvery15s(20, {}, 330),
	]);

	assert.deepEqual(
		sessions.map((session) => [
			(session.startedAt.getTime() - BASE_TIME) / 1000,
			(session.endedAt.getTime() - BASE_TIME) / 1000,
			session.durationSeconds,
		]),
		[
			[0, 300, 300],
			[330, 630, 300],
		],
	);
});

test("segmentRawEvents gives simultaneous desktop activity stable precedence over browser duplicates", () => {
	const events = samplesEvery15s(20).flatMap((sample) => [
		sample,
		{
			...sample,
			source: "BROWSER",
			appName: "figma.com",
			repoName: null,
			branchName: null,
		},
	]);

	for (const ordered of [events, [...events].reverse()]) {
		const sessions = segmentRawEvents(ordered);

		assert.equal(sessions.length, 1);
		assert.equal(sessions[0]?.appName, "Code");
		assert.equal(sessions[0]?.durationSeconds, 300);
	}
});

for (const appName of ["Code", null]) {
	test(`segmentRawEvents gives simultaneous OS idle priority over browser activity with appName ${appName}`, () => {
		const events = samplesEvery15s(20, { isIdle: true, appName }).flatMap(
			(sample) => [
				sample,
				{ ...sample, source: "BROWSER", appName: "figma.com", isIdle: false },
			],
		);

		assert.deepEqual(segmentRawEvents(events), []);
		assert.deepEqual(segmentRawEvents([...events].reverse()), []);
	});
}

test("collector scheduling jitter preserves work without charging the uncovered gaps", () => {
	const sessions = segmentRawEvents(
		Array.from({ length: 20 }, (_, index) => osSample(index * 15.2)),
	);
	assert.equal(sessions.length, 1);
	assert.equal(sessions[0]?.durationSeconds, 300);
});

test("fractional timestamps never extend coverage into the next activity", () => {
	const sessions = segmentRawEvents(
		[osSample(0), osSample(14.7, { isIdle: true })],
		{ ...DEFAULT_SEGMENTATION_OPTIONS, minimumSessionSeconds: 1 },
	);
	assert.equal(sessions[0]?.endedAt.getTime(), BASE_TIME + 14_700);
	assert.equal(sessions[0]?.durationSeconds, 14);
});
