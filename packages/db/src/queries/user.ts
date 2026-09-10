import { eq } from "drizzle-orm";

import { db } from "../index";
import { user } from "../schema/auth";

const preferenceColumns = {
	locale: user.locale,
	aiLabelingEnabled: user.aiLabelingEnabled,
	excludedAppNames: user.excludedAppNames,
	excludedTitlePatterns: user.excludedTitlePatterns,
	excludedDomains: user.excludedDomains,
};

export async function findUserPreferences(userId: string) {
	const [row] = await db
		.select(preferenceColumns)
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);
	return row ?? null;
}

export async function updateUserPreferences(
	userId: string,
	values: Partial<
		Pick<
			typeof user.$inferInsert,
			| "locale"
			| "aiLabelingEnabled"
			| "excludedAppNames"
			| "excludedTitlePatterns"
			| "excludedDomains"
		>
	>,
) {
	const [row] = await db
		.update(user)
		.set(values)
		.where(eq(user.id, userId))
		.returning({ id: user.id, ...preferenceColumns });
	return row ?? null;
}

export async function findUserExclusions(userId: string) {
	const [row] = await db
		.select({
			excludedAppNames: user.excludedAppNames,
			excludedTitlePatterns: user.excludedTitlePatterns,
			excludedDomains: user.excludedDomains,
			aiLabelingEnabled: user.aiLabelingEnabled,
		})
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);
	return row ?? null;
}
