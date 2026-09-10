import { and, asc, desc, eq, isNull } from "drizzle-orm";

import { db } from "../index";
import { matchingRule, project } from "../schema/tracking";

export async function listMatchingRulesByUser(userId: string) {
	return db
		.select({
			id: matchingRule.id,
			projectId: matchingRule.projectId,
			projectName: project.name,
			field: matchingRule.field,
			operator: matchingRule.operator,
			value: matchingRule.value,
			label: matchingRule.label,
			priority: matchingRule.priority,
		})
		.from(matchingRule)
		.innerJoin(project, eq(project.id, matchingRule.projectId))
		.where(
			and(eq(matchingRule.userId, userId), isNull(matchingRule.archivedAt)),
		)
		.orderBy(desc(matchingRule.priority), asc(matchingRule.value));
}

export async function insertMatchingRule(
	values: typeof matchingRule.$inferInsert,
) {
	const [row] = await db
		.insert(matchingRule)
		.values(values)
		.returning({ id: matchingRule.id });
	return row;
}

export async function archiveMatchingRuleForUser(
	userId: string,
	ruleId: string,
	archivedAt: Date,
) {
	const [row] = await db
		.update(matchingRule)
		.set({ archivedAt })
		.where(
			and(
				eq(matchingRule.id, ruleId),
				eq(matchingRule.userId, userId),
				isNull(matchingRule.archivedAt),
			),
		)
		.returning({ id: matchingRule.id });
	return row ?? null;
}
