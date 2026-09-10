import { and, asc, eq, isNull } from "drizzle-orm";

import { db } from "../index";
import { matchingRule, project } from "../schema/tracking";

export async function listProjectsByUser(userId: string) {
	return db
		.select({
			id: project.id,
			name: project.name,
			clientName: project.clientName,
			color: project.color,
			billingRateCents: project.billingRateCents,
			createdAt: project.createdAt,
		})
		.from(project)
		.where(and(eq(project.userId, userId), isNull(project.archivedAt)))
		.orderBy(asc(project.name));
}

export async function findProjectByUser(userId: string, projectId: string) {
	const [row] = await db
		.select({
			id: project.id,
			name: project.name,
			clientName: project.clientName,
			color: project.color,
			billingRateCents: project.billingRateCents,
		})
		.from(project)
		.where(
			and(
				eq(project.id, projectId),
				eq(project.userId, userId),
				isNull(project.archivedAt),
			),
		)
		.limit(1);
	return row ?? null;
}

export async function findProjectByNameForUser(userId: string, name: string) {
	const [row] = await db
		.select({ id: project.id, name: project.name })
		.from(project)
		.where(
			and(
				eq(project.userId, userId),
				eq(project.name, name),
				isNull(project.archivedAt),
			),
		)
		.limit(1);
	return row ?? null;
}

export async function insertProject(values: typeof project.$inferInsert) {
	const [row] = await db
		.insert(project)
		.values(values)
		.returning({ id: project.id });
	return row;
}

export async function updateProjectForUser(
	userId: string,
	projectId: string,
	values: Partial<
		Pick<
			typeof project.$inferInsert,
			"name" | "clientName" | "color" | "billingRateCents"
		>
	>,
) {
	const [row] = await db
		.update(project)
		.set(values)
		.where(
			and(
				eq(project.id, projectId),
				eq(project.userId, userId),
				isNull(project.archivedAt),
			),
		)
		.returning({ id: project.id });
	return row ?? null;
}

export async function archiveProjectForUser(
	userId: string,
	projectId: string,
	archivedAt: Date,
) {
	const [row] = await db
		.update(project)
		.set({ archivedAt })
		.where(
			and(
				eq(project.id, projectId),
				eq(project.userId, userId),
				isNull(project.archivedAt),
			),
		)
		.returning({ id: project.id });
	if (row) {
		await db
			.update(matchingRule)
			.set({ archivedAt })
			.where(
				and(
					eq(matchingRule.projectId, projectId),
					eq(matchingRule.userId, userId),
					isNull(matchingRule.archivedAt),
				),
			);
	}
	return row ?? null;
}
