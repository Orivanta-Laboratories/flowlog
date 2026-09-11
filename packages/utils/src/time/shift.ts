export type WorkSchedule = {
	enabled: boolean;
	timezone: string;
	days: number[];
	startMinute: number;
	endMinute: number;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function isWithinWorkSchedule(
	date: Date,
	schedule: WorkSchedule | null,
): boolean {
	if (!schedule?.enabled) return true;
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: schedule.timezone,
		weekday: "short",
		hour: "numeric",
		minute: "numeric",
		hourCycle: "h23",
	}).formatToParts(date);
	const part = (type: string) =>
		parts.find((value) => value.type === type)?.value ?? "";
	const day = WEEKDAYS.indexOf(part("weekday"));
	const minute = Number(part("hour")) * 60 + Number(part("minute"));
	if (schedule.startMinute < schedule.endMinute) {
		return (
			schedule.days.includes(day) &&
			minute >= schedule.startMinute &&
			minute < schedule.endMinute
		);
	}
	return (
		(schedule.days.includes(day) && minute >= schedule.startMinute) ||
		(schedule.days.includes((day + 6) % 7) && minute < schedule.endMinute)
	);
}
