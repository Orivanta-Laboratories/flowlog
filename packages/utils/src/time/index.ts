const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;
const MILLISECONDS_PER_DAY =
	24 * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;

export function resolveDayRange(
	isoDate: string,
	timeZoneOffsetMinutes: number,
) {
	const [year, month, day] = isoDate.split("-").map(Number);
	const startUtcMillis = Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1);
	const from = new Date(
		startUtcMillis +
			timeZoneOffsetMinutes * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND,
	);
	const to = new Date(from.getTime() + MILLISECONDS_PER_DAY);
	return { from, to };
}

export function countDaysBetween(from: Date, to: Date) {
	return Math.ceil((to.getTime() - from.getTime()) / MILLISECONDS_PER_DAY);
}

export function secondsBetween(from: Date, to: Date) {
	return Math.max(
		0,
		Math.round((to.getTime() - from.getTime()) / MILLISECONDS_PER_SECOND),
	);
}

export function roundSecondsToBillableHours(
	seconds: number,
	incrementMinutes: number,
) {
	const incrementSeconds = incrementMinutes * SECONDS_PER_MINUTE;
	const rounded = Math.ceil(seconds / incrementSeconds) * incrementSeconds;
	return rounded / (SECONDS_PER_MINUTE * MINUTES_PER_HOUR);
}

export function formatDurationParts(seconds: number) {
	const hours = Math.floor(seconds / (SECONDS_PER_MINUTE * MINUTES_PER_HOUR));
	const minutes = Math.floor(
		(seconds % (SECONDS_PER_MINUTE * MINUTES_PER_HOUR)) / SECONDS_PER_MINUTE,
	);
	return { hours, minutes };
}

export function splitTrackedSeconds(
	durationSeconds: number,
	spanSeconds: number,
	firstSpanSeconds: number,
): [number, number] {
	const first = Math.floor((durationSeconds * firstSpanSeconds) / spanSeconds);
	return [first, durationSeconds - first];
}
