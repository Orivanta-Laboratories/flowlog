export function formatClockTime(date: Date): string {
	return date.toLocaleTimeString(undefined, {
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function formatDurationLabel(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.round((seconds % 3600) / 60);
	if (hours === 0) {
		return `${minutes}m`;
	}
	return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export function toDateInputValue(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

export function addDaysToDateInputValue(value: string, days: number): string {
	const [year, month, day] = value.split("-").map(Number);
	const date = new Date(year ?? 0, (month ?? 1) - 1, (day ?? 1) + days);
	return toDateInputValue(date);
}

export function toTimeInputValue(date: Date): string {
	return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function combineDateAndTime(
	referenceDate: Date,
	timeValue: string,
): Date {
	const [hours, minutes] = timeValue.split(":").map(Number);
	const combined = new Date(referenceDate);
	combined.setHours(hours ?? 0, minutes ?? 0, 0, 0);
	return combined;
}
