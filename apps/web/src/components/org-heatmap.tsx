"use client";

import { cn } from "@flowlog/ui/lib/utils";

import { formatDurationLabel } from "@/helpers/format-time";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const INTENSITY_BUCKET_COUNT = 5;
const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"] as const;

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
	"bg-primary/25",
	"bg-primary/45",
	"bg-primary/70",
	"bg-primary",
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
	const totalSeconds = range.reduce(
		(total, entry) => total + entry.trackedSeconds,
		0,
	);

	const leadingBlanks = range[0] ? range[0].date.getUTCDay() : 0;
	const cells: Array<HeatmapDay | null> = [
		...Array.from({ length: leadingBlanks }, () => null),
		...range,
	];

	return (
		<figure className="m-0">
			<div className="overflow-x-auto">
				<div className="flex w-fit gap-2">
					<div
						aria-hidden="true"
						className="grid grid-rows-7 gap-1 pt-px text-[10px] text-muted-foreground leading-none"
					>
						{WEEKDAY_INITIALS.map((initial, index) => (
							<span
								key={`${initial}-${index}`}
								className="flex size-3 items-center justify-center"
							>
								{index % 2 === 1 ? initial : ""}
							</span>
						))}
					</div>
					<div
						className="grid grid-flow-col grid-rows-7 gap-1"
						role="img"
						aria-label={`Organization-wide tracked time over the last ${days} days, ${formatDurationLabel(totalSeconds)} in total`}
					>
						{cells.map((cell, index) =>
							cell === null ? (
								<div key={`blank-${index}`} className="size-3" />
							) : (
								<div
									key={toIsoDateKey(cell.date)}
									title={`${cell.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}: ${formatDurationLabel(cell.trackedSeconds)}`}
									className={cn(
										"size-3 rounded-sm",
										INTENSITY_CLASSES[
											intensityBucket(cell.trackedSeconds, maxSeconds)
										],
									)}
								/>
							),
						)}
					</div>
				</div>
			</div>
			<figcaption className="mt-3 flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
				<span>
					{formatDurationLabel(totalSeconds)} over {days} days
				</span>
				<span className="ml-auto flex items-center gap-1.5">
					Less
					{INTENSITY_CLASSES.map((intensity) => (
						<span
							key={intensity}
							aria-hidden="true"
							className={cn("size-3 rounded-sm", intensity)}
						/>
					))}
					More
				</span>
			</figcaption>
		</figure>
	);
}
