import {
	and,
	asc,
	desc,
	eq,
	gt,
	gte,
	inArray,
	isNull,
	lt,
	sql,
} from "drizzle-orm";

import { SESSION_STATUS, SUGGESTION_SOURCE } from "../constants";
import { db } from "../index";
import { activitySession, project } from "../schema/tracking";

const sessionListColumns = {
	id: activitySession.id,
	startedAt: activitySession.startedAt,
	endedAt: activitySession.endedAt,
	durationSeconds: activitySession.durationSeconds,
	appName: activitySession.appName,
	windowTitle: activitySession.windowTitle,
	repoName: activitySession.repoName,
	branchName: activitySession.branchName,
	commitSubjects: activitySession.commitSubjects,
	signalFingerprint: activitySession.signalFingerprint,
	status: activitySession.status,
	suggestedLabel: activitySession.suggestedLabel,
	suggestionSource: activitySession.suggestionSource,
	suggestionRationale: activitySession.suggestionRationale,
	confidencePercent: activitySession.confidencePercent,
	finalLabel: activitySession.finalLabel,
	projectId: activitySession.projectId,
	projectName: project.name,
	projectColor: project.color,
	edited: activitySession.edited,
	confirmedAt: activitySession.confirmedAt,
};

export async function listActivitySessionsInRange(
	userId: string,
	from: Date,
	to: Date,
	cursor: Date | null,
	limit: number,
) {
	return db
		.select(sessionListColumns)
		.from(activitySession)
		.leftJoin(project, eq(project.id, activitySession.projectId))
		.where(
			and(
				eq(activitySession.userId, userId),
				isNull(activitySession.archivedAt),
				gte(activitySession.startedAt, from),
				lt(activitySession.startedAt, to),
				cursor ? gt(activitySession.startedAt, cursor) : undefined,
			),
		)
		.orderBy(asc(activitySession.startedAt))
		.limit(limit);
}

export async function findActivitySessionForUser(
	userId: string,
	activitySessionId: string,
) {
	const [row] = await db
		.select(sessionListColumns)
		.from(activitySession)
		.leftJoin(project, eq(project.id, activitySession.projectId))
		.where(
			and(
				eq(activitySession.id, activitySessionId),
				eq(activitySession.userId, userId),
				isNull(activitySession.archivedAt),
			),
		)
		.limit(1);
	return row ?? null;
}

export async function findActivitySessionsForUser(
	userId: string,
	activitySessionIds: string[],
) {
	if (activitySessionIds.length === 0) {
		return [];
	}
	return db
		.select(sessionListColumns)
		.from(activitySession)
		.leftJoin(project, eq(project.id, activitySession.projectId))
		.where(
			and(
				eq(activitySession.userId, userId),
				inArray(activitySession.id, activitySessionIds),
				isNull(activitySession.archivedAt),
			),
		)
		.orderBy(asc(activitySession.startedAt));
}

export async function listPendingActivitySessions(
	userId: string,
	limit: number,
) {
	return db
		.select({
			id: activitySession.id,
			appName: activitySession.appName,
			windowTitle: activitySession.windowTitle,
			repoName: activitySession.repoName,
			branchName: activitySession.branchName,
			commitSubjects: activitySession.commitSubjects,
			durationSeconds: activitySession.durationSeconds,
			signalFingerprint: activitySession.signalFingerprint,
			startedAt: activitySession.startedAt,
		})
		.from(activitySession)
		.where(
			and(
				eq(activitySession.userId, userId),
				isNull(activitySession.archivedAt),
				eq(activitySession.suggestionSource, SUGGESTION_SOURCE.NONE),
				eq(activitySession.status, SESSION_STATUS.SUGGESTED),
			),
		)
		.orderBy(desc(activitySession.startedAt))
		.limit(limit);
}

export async function upsertActivitySessions(
	values: (typeof activitySession.$inferInsert)[],
) {
	if (values.length === 0) {
		return [];
	}
	return db
		.insert(activitySession)
		.values(values)
		.onConflictDoUpdate({
			target: [activitySession.userId, activitySession.startedAt],
			set: {
				endedAt: sql`excluded.ended_at`,
				durationSeconds: sql`excluded.duration_seconds`,
				appName: sql`excluded.app_name`,
				windowTitle: sql`excluded.window_title`,
				repoName: sql`excluded.repo_name`,
				branchName: sql`excluded.branch_name`,
				commitSubjects: sql`excluded.commit_subjects`,
				signalFingerprint: sql`excluded.signal_fingerprint`,
			},
			setWhere: and(
				eq(activitySession.status, SESSION_STATUS.SUGGESTED),
				eq(activitySession.edited, false),
				isNull(activitySession.archivedAt),
			),
		})
		.returning({
			id: activitySession.id,
			startedAt: activitySession.startedAt,
		});
}

export async function updateActivitySessionForUser(
	userId: string,
	activitySessionId: string,
	values: Partial<typeof activitySession.$inferInsert>,
) {
	const [row] = await db
		.update(activitySession)
		.set(values)
		.where(
			and(
				eq(activitySession.id, activitySessionId),
				eq(activitySession.userId, userId),
				isNull(activitySession.archivedAt),
			),
		)
		.returning({ id: activitySession.id });
	return row ?? null;
}

export async function updateActivitySessionsForUser(
	userId: string,
	activitySessionIds: string[],
	values: Partial<typeof activitySession.$inferInsert>,
) {
	if (activitySessionIds.length === 0) {
		return [];
	}
	return db
		.update(activitySession)
		.set(values)
		.where(
			and(
				eq(activitySession.userId, userId),
				inArray(activitySession.id, activitySessionIds),
				isNull(activitySession.archivedAt),
			),
		)
		.returning({ id: activitySession.id });
}

export async function archiveActivitySessionsForUser(
	userId: string,
	activitySessionIds: string[],
	archivedAt: Date,
) {
	if (activitySessionIds.length === 0) {
		return [];
	}
	return db
		.update(activitySession)
		.set({ archivedAt })
		.where(
			and(
				eq(activitySession.userId, userId),
				inArray(activitySession.id, activitySessionIds),
				isNull(activitySession.archivedAt),
			),
		)
		.returning({ id: activitySession.id });
}

export async function insertActivitySession(
	values: typeof activitySession.$inferInsert,
) {
	const [row] = await db
		.insert(activitySession)
		.values(values)
		.returning({ id: activitySession.id });
	return row;
}

export async function replaceActivitySessionsForUser(
	userId: string,
	firstId: string,
	values: Partial<typeof activitySession.$inferInsert>,
	archiveIds: string[],
	additional: (typeof activitySession.$inferInsert)[] = [],
) {
	const operations = [
		db
			.update(activitySession)
			.set({ ...values, edited: true })
			.where(
				and(
					eq(activitySession.id, firstId),
					eq(activitySession.userId, userId),
					isNull(activitySession.archivedAt),
					eq(activitySession.status, SESSION_STATUS.SUGGESTED),
				),
			)
			.returning({ id: activitySession.id }),
		...archiveIds.map((id) =>
			db
				.update(activitySession)
				.set({ archivedAt: new Date() })
				.where(
					and(
						eq(activitySession.id, id),
						eq(activitySession.userId, userId),
						eq(activitySession.status, SESSION_STATUS.SUGGESTED),
					),
				),
		),
		...additional.map((row) =>
			db
				.insert(activitySession)
				.values({ ...row, userId, edited: true })
				.returning({ id: activitySession.id }),
		),
	] as const;
	const result = await db.batch(operations);
	return result[0][0];
}
