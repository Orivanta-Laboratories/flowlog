"use client";

import { cn } from "@flowlog/ui/lib/utils";

import { formatDurationLabel } from "@/helpers/format-time";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const INTENSITY_BUCKET_COUNT = 5;

type HeatmapDay = {
	date: Date;
	trackedSeconds: number;
};

function toIsoDateKey(date: Date): string {
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const day = String(date.getUTCDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function buildDayRange(days: number): Date[] {
	const today = new Date();
	const todayUtc = Date.UTC(
		today.getUTCFullYear(),
		today.getUTCMonth(),
		today.getUTCDate(),
	);
	return Array.from(
		{ length: days },
		(_, index) =>
			new Date(todayUtc - (days - 1 - index) * MILLISECONDS_PER_DAY),
	);
}

function intensityBucket(trackedSeconds: number, maxSeconds: number): number {
	if (trackedSeconds === 0 || maxSeconds === 0) {
		return 0;
	}
	const ratio = trackedSeconds / maxSeconds;
	return Math.min(
		INTENSITY_BUCKET_COUNT - 1,
		Math.max(1, Math.ceil(ratio * (INTENSITY_BUCKET_COUNT - 1))),
	);
}

const INTENSITY_CLASSES = [
	"bg-muted",
	"bg-primary/20",
	"bg-primary/40",
	"bg-primary/60",
	"bg-primary/85",
];

export function OrgHeatmap({
	data,
	days,
}: {
	data: Array<{ day: string; trackedSeconds: number }>;
	days: number;
}) {
	const trackedSecondsByDay = new Map(
		data.map((entry) => [
			toIsoDateKey(new Date(entry.day)),
			entry.trackedSeconds,
		]),
	);

	const range: HeatmapDay[] = buildDayRange(days).map((date) => ({
		date,
		trackedSeconds: trackedSecondsByDay.get(toIsoDateKey(date)) ?? 0,
	}));

	const maxSeconds = range.reduce(
		(max, entry) => Math.max(max, entry.trackedSeconds),
		0,
	);

	const leadingBlanks = range[0] ? range[0].date.getUTCDay() : 0;
	const cells: Array<HeatmapDay | null> = [
		...Array.from({ length: leadingBlanks }, () => null),
		...range,
	];

	return (
		<div
			className="grid grid-flow-col grid-rows-7 gap-1"
			role="img"
			aria-label={`Org-wide tracked time over the last ${days} days`}
		>
			{cells.map((cell, index) =>
				cell === null ? (
					<div key={`blank-${index}`} className="size-3" />
				) : (
					<div
						key={toIsoDateKey(cell.date)}
						title={`${cell.date.toLocaleDateString()}: ${formatDurationLabel(cell.trackedSeconds)}`}
						className={cn(
							"size-3",
							INTENSITY_CLASSES[
								intensityBucket(cell.trackedSeconds, maxSeconds)
							],
						)}
					/>
				),
			)}
		</div>
	);
}
