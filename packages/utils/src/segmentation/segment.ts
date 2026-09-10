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
	maxSampleGapSeconds: number;
	minimumSessionSeconds: number;
	absorbNoiseSeconds: number;
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
	maxSampleGapSeconds: 90,
	minimumSessionSeconds: 90,
	absorbNoiseSeconds: 90,
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
	return Math.round((span.endedAt.getTime() - span.startedAt.getTime()) / 1000);
}

function gapSecondsBetween(earlier: Span, later: Span): number {
	return Math.round(
		(later.startedAt.getTime() - earlier.endedAt.getTime()) / 1000,
	);
}

function toActivitySamples(
	events: SegmentationEvent[],
	options: SegmentationOptions,
): ActivitySample[] {
	const trackable = events.filter(
		(event) =>
			(event.source === EVENT_SOURCE.OS ||
				event.source === EVENT_SOURCE.BROWSER) &&
			event.appName !== null,
	);
	return trackable.map((event, index) => {
		const next = trackable[index + 1];
		const ownIntervalSeconds = expectedIntervalSeconds(event.source, options);
		const gapSeconds = next
			? Math.round(
					(next.occurredAt.getTime() - event.occurredAt.getTime()) / 1000,
				)
			: ownIntervalSeconds;
		const appName = event.appName ?? "";
		return {
			occurredAt: event.occurredAt,
			coverageSeconds: event.isIdle
				? 0
				: Math.max(0, Math.min(ownIntervalSeconds, gapSeconds)),
			activityKey: event.isIdle
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

function groupSamplesIntoSpans(
	samples: ActivitySample[],
	options: SegmentationOptions,
): Span[] {
	const spans: Span[] = [];
	for (const sample of samples) {
		if (sample.activityKey === "") {
			continue;
		}
		const current = spans.at(-1);
		const continuesCurrent =
			current !== undefined &&
			current.activityKey === sample.activityKey &&
			Math.round(
				(sample.occurredAt.getTime() - current.endedAt.getTime()) / 1000,
			) <= options.maxSampleGapSeconds;
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

function absorbShortInterruptions(
	spans: Span[],
	options: SegmentationOptions,
): Span[] {
	const merged: Span[] = [];
	let index = 0;
	while (index < spans.length) {
		const current = spans[index];
		if (!current) {
			break;
		}
		const previous = merged.at(-1);
		const next = spans[index + 1];
		const bridgesBackToPrevious =
			previous !== undefined &&
			next !== undefined &&
			previous.activityKey === next.activityKey &&
			spanDurationSeconds(current) < options.absorbNoiseSeconds &&
			gapSecondsBetween(previous, current) <= options.maxSampleGapSeconds &&
			gapSecondsBetween(current, next) <= options.maxSampleGapSeconds;
		if (bridgesBackToPrevious && previous && next) {
			previous.samples.push(
				...current.samples.filter(
					(sample) => sample.activityKey === previous.activityKey,
				),
				...next.samples,
			);
			previous.endedAt = next.endedAt;
			index += 2;
			continue;
		}
		const continuesPrevious =
			previous !== undefined &&
			previous.activityKey === current.activityKey &&
			gapSecondsBetween(previous, current) <= options.maxSampleGapSeconds;
		if (continuesPrevious && previous) {
			previous.samples.push(...current.samples);
			previous.endedAt = current.endedAt;
			index += 1;
			continue;
		}
		merged.push({ ...current, samples: [...current.samples] });
		index += 1;
	}
	return merged;
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
		(left, right) => left.occurredAt.getTime() - right.occurredAt.getTime(),
	);
	const samples = toActivitySamples(ordered, options);
	const spans = absorbShortInterruptions(
		groupSamplesIntoSpans(samples, options),
		options,
	);

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
