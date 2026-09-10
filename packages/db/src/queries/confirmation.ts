import { and, desc, eq, gte, lt } from "drizzle-orm";

import { db } from "../index";
import { confirmation } from "../schema/tracking";

export async function insertConfirmations(
	values: (typeof confirmation.$inferInsert)[],
) {
	if (values.length === 0) {
		return [];
	}
	return db
		.insert(confirmation)
		.values(values)
		.returning({ id: confirmation.id });
}

export async function findLatestConfirmationByFingerprint(
	userId: string,
	fingerprint: string,
) {
	const [row] = await db
		.select({
			finalLabel: confirmation.finalLabel,
			finalProjectId: confirmation.finalProjectId,
			confirmedAt: confirmation.confirmedAt,
		})
		.from(confirmation)
		.where(
			and(
				eq(confirmation.userId, userId),
				eq(confirmation.signalFingerprint, fingerprint),
			),
		)
		.orderBy(desc(confirmation.confirmedAt))
		.limit(1);
	return row ?? null;
}

export async function listConfirmationsInRange(
	userId: string,
	from: Date,
	to: Date,
) {
	return db
		.select({
			activitySessionId: confirmation.activitySessionId,
			finalLabel: confirmation.finalLabel,
			suggestedLabel: confirmation.suggestedLabel,
			suggestionSource: confirmation.suggestionSource,
			confidencePercent: confirmation.confidencePercent,
			edited: confirmation.edited,
			confirmedAt: confirmation.confirmedAt,
		})
		.from(confirmation)
		.where(
			and(
				eq(confirmation.userId, userId),
				gte(confirmation.confirmedAt, from),
				lt(confirmation.confirmedAt, to),
			),
		)
		.orderBy(desc(confirmation.confirmedAt));
}
