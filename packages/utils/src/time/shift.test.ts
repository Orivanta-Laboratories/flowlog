import assert from "node:assert/strict";
import { test } from "node:test";
import { isWithinWorkSchedule, type WorkSchedule } from "./shift";

const schedule: WorkSchedule = {
	enabled: true,
	timezone: "Africa/Kigali",
	days: [1, 2, 3, 4, 5],
	startMinute: 540,
	endMinute: 1020,
};

test("shifts include the start, exclude the end, and skip days off", () => {
	assert.equal(
		isWithinWorkSchedule(new Date("2026-09-10T07:00Z"), schedule),
		true,
	);
	assert.equal(
		isWithinWorkSchedule(new Date("2026-09-10T15:00Z"), schedule),
		false,
	);
	assert.equal(
		isWithinWorkSchedule(new Date("2026-09-12T09:00Z"), schedule),
		false,
	);
});
test("overnight shifts belong to their starting weekday", () => {
	const overnight = {
		...schedule,
		days: [5],
		startMinute: 1320,
		endMinute: 360,
	};
	assert.equal(
		isWithinWorkSchedule(new Date("2026-09-12T01:00Z"), overnight),
		true,
	);
	assert.equal(
		isWithinWorkSchedule(new Date("2026-09-12T04:00Z"), overnight),
		false,
	);
});
test("timezone rules follow daylight saving changes", () => {
	const ny = { ...schedule, timezone: "America/New_York" };
	assert.equal(isWithinWorkSchedule(new Date("2026-03-06T14:00Z"), ny), true);
	assert.equal(isWithinWorkSchedule(new Date("2026-03-09T13:00Z"), ny), true);
	assert.equal(isWithinWorkSchedule(new Date("2026-03-09T12:59Z"), ny), false);
});
test("manual tracking does not impose a schedule", () => {
	assert.equal(isWithinWorkSchedule(new Date(), null), true);
});
