import { eq } from "drizzle-orm";

import { db } from "../index";
import { user } from "../schema/auth";

export async function findUserPreferences(userId: string) {
	const [row] = await db
		.select({
			locale: user.locale,
			aiLabelingEnabled: user.aiLabelingEnabled,
		})
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);
	return row ?? null;
}

export async function updateUserPreferences(
	userId: string,
	values: Partial<Pick<typeof user.$inferInsert, "locale" | "aiLabelingEnabled">>,
) {
	const [row] = await db
		.update(user)
		.set(values)
		.where(eq(user.id, userId))
		.returning({ id: user.id, locale: user.locale, aiLabelingEnabled: user.aiLabelingEnabled });
	return row ?? null;
}
