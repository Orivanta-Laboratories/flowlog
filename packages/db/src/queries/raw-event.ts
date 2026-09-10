import { and, asc, eq, gte, lt, lte } from "drizzle-orm";

import { db } from "../index";
import { rawEvent } from "../schema/tracking";

export async function insertRawEvents(
	values: (typeof rawEvent.$inferInsert)[],
) {
	if (values.length === 0) {
		return [];
	}
	return db
		.insert(rawEvent)
		.values(values)
		.onConflictDoNothing({
			target: [rawEvent.deviceId, rawEvent.clientEventId],
		})
		.returning({ id: rawEvent.id });
}

export async function listRawEventsInRange(
	userId: string,
	from: Date,
	to: Date,
) {
	return db
		.select({
			occurredAt: rawEvent.occurredAt,
			source: rawEvent.source,
			appName: rawEvent.appName,
			windowTitle: rawEvent.windowTitle,
			repoName: rawEvent.repoName,
			branchName: rawEvent.branchName,
			commitSubject: rawEvent.commitSubject,
			isIdle: rawEvent.isIdle,
		})
		.from(rawEvent)
		.where(
			and(
				eq(rawEvent.userId, userId),
				gte(rawEvent.occurredAt, from),
				lt(rawEvent.occurredAt, to),
			),
		)
		.orderBy(asc(rawEvent.occurredAt));
}

export async function deleteRawEventsBefore(userId: string, before: Date) {
	const rows = await db
		.delete(rawEvent)
		.where(and(eq(rawEvent.userId, userId), lte(rawEvent.occurredAt, before)))
		.returning({ id: rawEvent.id });
	return rows.length;
}
