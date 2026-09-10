import { EVENT_SOURCE } from "@flowlog/db/constants";

export type SegmentationEvent = {
	occurredAt: Date;
	source: string;
	appName: string | null;
	windowTitle: string | null;
	repoName: string | null;
	branchName: string | null;
	commitSubject: string | null;
	isIdle: boolean;
};

export type SegmentationOptions = {
	sampleIntervalSeconds: number;
	browserSampleIntervalSeconds: number;
	minimumSessionSeconds: number;
};

export type SegmentedSession = {
	startedAt: Date;
	endedAt: Date;
	durationSeconds: number;
	appName: string;
	windowTitle: string | null;
	repoName: string | null;
	branchName: string | null;
	commitSubjects: string[];
};

type ActivitySample = {
	occurredAt: Date;
	coverageSeconds: number;
	activityKey: string;
	appName: string;
	windowTitle: string | null;
	repoName: string | null;
	branchName: string | null;
};

type Span = {
	samples: ActivitySample[];
	startedAt: Date;
	endedAt: Date;
	activityKey: string;
};

export const DEFAULT_SEGMENTATION_OPTIONS: SegmentationOptions = {
	sampleIntervalSeconds: 15,
	browserSampleIntervalSeconds: 60,
	minimumSessionSeconds: 90,
};

function expectedIntervalSeconds(
	source: string,
	options: SegmentationOptions,
): number {
	return source === EVENT_SOURCE.BROWSER
		? options.browserSampleIntervalSeconds
		: options.sampleIntervalSeconds;
}

export function buildActivityKey(activity: {
	appName: string;
	repoName: string | null;
	branchName: string | null;
}): string {
	return [
		activity.appName,
		activity.repoName ?? "",
		activity.branchName ?? "",
	].join("|");
}

function spanDurationSeconds(span: Span): number {
	return Math.floor(
		span.samples.reduce(
			(seconds, sample) => seconds + sample.coverageSeconds,
			0,
		),
	);
}

function toActivitySamples(
	events: SegmentationEvent[],
	options: SegmentationOptions,
): ActivitySample[] {
	const trackable = events.filter(
		(event) =>
			event.source === EVENT_SOURCE.OS || event.source === EVENT_SOURCE.BROWSER,
	);
	return trackable.map((event, index) => {
		const next = trackable[index + 1];
		const ownIntervalSeconds = expectedIntervalSeconds(event.source, options);
		const gapSeconds = next
			? (next.occurredAt.getTime() - event.occurredAt.getTime()) / 1000
			: ownIntervalSeconds;
		const appName = event.appName ?? "";
		return {
			occurredAt: event.occurredAt,
			coverageSeconds:
				event.isIdle || event.appName === null
					? 0
					: Math.max(0, Math.min(ownIntervalSeconds, gapSeconds)),
			activityKey:
				event.isIdle || event.appName === null
					? ""
					: buildActivityKey({
							appName,
							repoName: event.repoName,
							branchName: event.branchName,
						}),
			appName,
			windowTitle: event.windowTitle,
			repoName: event.repoName,
			branchName: event.branchName,
		};
	});
}

function groupSamplesIntoSpans(samples: ActivitySample[]): Span[] {
	const spans: Span[] = [];
	let boundary = false;
	for (const sample of samples) {
		if (sample.activityKey === "" || sample.coverageSeconds <= 0) {
			boundary = true;
			continue;
		}
		const current = spans.at(-1);
		const continuesCurrent =
			!boundary &&
			current !== undefined &&
			current.activityKey === sample.activityKey &&
			sample.occurredAt.getTime() - current.endedAt.getTime() <= 2000;
		boundary = false;
		const sampleEndedAt = new Date(
			sample.occurredAt.getTime() + sample.coverageSeconds * 1000,
		);
		if (continuesCurrent && current) {
			current.samples.push(sample);
			current.endedAt = sampleEndedAt;
			continue;
		}
		spans.push({
			samples: [sample],
			startedAt: sample.occurredAt,
			endedAt: sampleEndedAt,
			activityKey: sample.activityKey,
		});
	}
	return spans;
}

function pickRepresentativeWindowTitle(
	samples: ActivitySample[],
): string | null {
	const coverageByTitle = new Map<string, number>();
	for (const sample of samples) {
		if (sample.windowTitle === null) {
			continue;
		}
		coverageByTitle.set(
			sample.windowTitle,
			(coverageByTitle.get(sample.windowTitle) ?? 0) +
				Math.max(sample.coverageSeconds, 1),
		);
	}
	const ranked = [...coverageByTitle.entries()].sort(
		(left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
	);
	return ranked[0]?.[0] ?? null;
}

function collectCommitSubjects(
	events: SegmentationEvent[],
	span: Span,
	repoName: string | null,
) {
	return events
		.filter(
			(event) =>
				event.source === EVENT_SOURCE.GIT &&
				event.commitSubject !== null &&
				event.occurredAt >= span.startedAt &&
				event.occurredAt <= span.endedAt &&
				(repoName === null ||
					event.repoName === null ||
					event.repoName === repoName),
		)
		.map((event) => event.commitSubject as string);
}

export function segmentRawEvents(
	events: SegmentationEvent[],
	options: SegmentationOptions = DEFAULT_SEGMENTATION_OPTIONS,
): SegmentedSession[] {
	const ordered = [...events].sort(
		(left, right) =>
			left.occurredAt.getTime() - right.occurredAt.getTime() ||
			Number(right.source === EVENT_SOURCE.OS) -
				Number(left.source === EVENT_SOURCE.OS) ||
			Number(right.isIdle) - Number(left.isIdle) ||
			buildActivityKey({ ...left, appName: left.appName ?? "" }).localeCompare(
				buildActivityKey({ ...right, appName: right.appName ?? "" }),
			),
	);
	const observations = ordered.filter(
		(event) => event.source !== EVENT_SOURCE.GIT,
	);
	const unique = observations.filter(
		(event, index) =>
			index === 0 ||
			observations[index - 1]?.occurredAt.getTime() !==
				event.occurredAt.getTime(),
	);
	const samples = toActivitySamples(unique, options);
	const spans = groupSamplesIntoSpans(samples);

	return spans
		.filter(
			(span) => spanDurationSeconds(span) >= options.minimumSessionSeconds,
		)
		.map((span) => {
			const anchor = span.samples[0];
			const repoName = anchor?.repoName ?? null;
			return {
				startedAt: span.startedAt,
				endedAt: span.endedAt,
				durationSeconds: spanDurationSeconds(span),
				appName: anchor?.appName ?? "",
				windowTitle: pickRepresentativeWindowTitle(span.samples),
				repoName,
				branchName: anchor?.branchName ?? null,
				commitSubjects: [
					...new Set(collectCommitSubjects(ordered, span, repoName)),
				],
			};
		});
}
