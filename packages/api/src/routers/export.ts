import { MAX_EXPORT_RANGE_DAYS, SESSION_STATUS } from "@flowlog/db/constants";
import { listActivitySessionsInRange } from "@flowlog/db/queries/activity-session";
import {
	countDaysBetween,
	ExportRangeTooLargeError,
	formatDurationParts,
	resolveDayRange,
} from "@flowlog/utils";
import { z } from "zod";

import { protectedProcedure } from "../index";
import { throwAsOrpcError } from "../to-orpc-error";

const exportTimesheetSchema = z.object({
	fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	timezoneOffsetMinutes: z.number().int(),
});

function csvEscape(value: string): string {
	return `"${value.replace(/"/g, '""')}"`;
}

export const exportTimesheet = protectedProcedure
	.input(exportTimesheetSchema)
	.handler(async ({ input, context }) => {
		const { from } = resolveDayRange(
			input.fromDate,
			input.timezoneOffsetMinutes,
		);
		const { to } = resolveDayRange(input.toDate, input.timezoneOffsetMinutes);

		if (countDaysBetween(from, to) > MAX_EXPORT_RANGE_DAYS) {
			throwAsOrpcError(new ExportRangeTooLargeError(MAX_EXPORT_RANGE_DAYS));
		}

		const sessions = await listActivitySessionsInRange(
			context.session.user.id,
			from,
			to,
			null,
			5000,
		);
		const confirmed = sessions.filter(
			(session) => session.status === SESSION_STATUS.CONFIRMED,
		);

		const header = ["Date", "Start", "End", "Duration (h)", "Label", "Project"];
		const rows = confirmed.map((session) => {
			const { hours, minutes } = formatDurationParts(session.durationSeconds);
			return [
				session.startedAt.toISOString().slice(0, 10),
				session.startedAt.toISOString(),
				session.endedAt.toISOString(),
				`${hours}.${Math.round((minutes / 60) * 100)
					.toString()
					.padStart(2, "0")}`,
				session.finalLabel ?? session.suggestedLabel ?? "",
				session.projectName ?? "",
			];
		});

		const csv = [header, ...rows]
			.map((columns) =>
				columns.map((column) => csvEscape(String(column))).join(","),
			)
			.join("\n");

		return { csv, rowCount: rows.length };
	});

export const exportRouter = {
	timesheet: exportTimesheet,
};
