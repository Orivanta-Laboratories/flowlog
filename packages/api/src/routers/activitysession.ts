import { AI_SUGGESTION_BATCH_CAP, SESSION_STATUS } from "@flowlog/db/constants";
import {
	archiveActivitySessionsForUser,
	findActivitySessionForUser,
	findActivitySessionsForUser,
	insertActivitySession,
	listActivitySessionsInRange,
	listPendingActivitySessions,
	updateActivitySessionForUser,
	upsertActivitySessions,
} from "@flowlog/db/queries/activity-session";
import {
	findLatestConfirmationByFingerprint,
	insertConfirmations,
} from "@flowlog/db/queries/confirmation";
import { listMatchingRulesByUser } from "@flowlog/db/queries/matching-rule";
import { listProjectsByUser } from "@flowlog/db/queries/project";
import { listRawEventsInRange } from "@flowlog/db/queries/raw-event";
import { findUserExclusions } from "@flowlog/db/queries/user";
import {
	ActivitySessionAlreadyConfirmedError,
	ActivitySessionNotAdjacentError,
	ActivitySessionNotFoundError,
	ActivitySessionSplitOutOfRangeError,
	buildAiSuggestion,
	buildSignalFingerprint,
	isExcludedActivity,
	resolveDayRange,
	secondsBetween,
	segmentRawEvents,
	selectLocalSuggestion,
} from "@flowlog/utils";

import { z } from "zod";

import { protectedProcedure } from "../index";
import { labelSuggestionModel } from "../lib/model";
import { throwAsOrpcError } from "../to-orpc-error";

const listActivitySessionsSchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	timezoneOffsetMinutes: z.number().int(),
});

async function syncSessionsForRange(userId: string, from: Date, to: Date) {
	const [rawEvents, exclusions] = await Promise.all([
		listRawEventsInRange(userId, from, to),
		findUserExclusions(userId),
	]);

	const trackable = rawEvents.filter(
		(event) =>
			exclusions === null ||
			!isExcludedActivity(
				{ appName: event.appName, windowTitle: event.windowTitle },
				{
					appNames: exclusions.excludedAppNames,
					titlePatterns: exclusions.excludedTitlePatterns,
				},
			),
	);

	const segmented = segmentRawEvents(trackable);
	if (segmented.length === 0) {
		return;
	}

	await upsertActivitySessions(
		segmented.map((session) => ({
			userId,
			startedAt: session.startedAt,
			endedAt: session.endedAt,
			durationSeconds: session.durationSeconds,
			appName: session.appName,
			windowTitle: session.windowTitle,
			repoName: session.repoName,
			branchName: session.branchName,
			commitSubjects: session.commitSubjects,
			signalFingerprint: buildSignalFingerprint({
				appName: session.appName,
				windowTitle: session.windowTitle,
				repoName: session.repoName,
				branchName: session.branchName,
			}),
		})),
	);
}

async function applyLocalSuggestions(userId: string) {
	const [pending, rules, projects] = await Promise.all([
		listPendingActivitySessions(userId, 200),
		listMatchingRulesByUser(userId),
		listProjectsByUser(userId),
	]);

	const stillPending: typeof pending = [];

	for (const session of pending) {
		const signals = {
			appName: session.appName,
			windowTitle: session.windowTitle,
			repoName: session.repoName,
			branchName: session.branchName,
		};
		const historyMatch = await findLatestConfirmationByFingerprint(
			userId,
			session.signalFingerprint,
		);
		const suggestion = selectLocalSuggestion(signals, rules, historyMatch);

		if (suggestion !== null) {
			await updateActivitySessionForUser(userId, session.id, {
				suggestedLabel: suggestion.label,
				suggestedProjectId: suggestion.projectId,
				suggestionSource: suggestion.source,
				suggestionRationale: suggestion.rationale,
				confidencePercent: suggestion.confidencePercent,
			});
		} else {
			stillPending.push(session);
		}
	}

	return { stillPending, projects };
}

async function applyAiSuggestions(
	userId: string,
	sessions: Awaited<ReturnType<typeof listPendingActivitySessions>>,
	projects: { id: string; name: string }[],
	aiLabelingEnabled: boolean,
) {
	if (!aiLabelingEnabled || sessions.length === 0) {
		return;
	}

	const batch = sessions.slice(0, AI_SUGGESTION_BATCH_CAP);
	for (const session of batch) {
		const suggestion = await buildAiSuggestion(labelSuggestionModel, {
			signals: {
				appName: session.appName,
				windowTitle: session.windowTitle,
				repoName: session.repoName,
				branchName: session.branchName,
			},
			durationSeconds: session.durationSeconds,
			commitSubjects: session.commitSubjects,
			knownProjects: projects,
		});
		if (suggestion !== null) {
			await updateActivitySessionForUser(userId, session.id, {
				suggestedLabel: suggestion.label,
				suggestedProjectId: suggestion.projectId,
				suggestionSource: suggestion.source,
				suggestionRationale: suggestion.rationale,
				confidencePercent: suggestion.confidencePercent,
			});
		}
	}
}

export const listActivitySessions = protectedProcedure
	.input(listActivitySessionsSchema)
	.handler(async ({ input, context }) => {
		const userId = context.session.user.id;
		const { from, to } = resolveDayRange(
			input.date,
			input.timezoneOffsetMinutes,
		);

		await syncSessionsForRange(userId, from, to);

		const { stillPending, projects } = await applyLocalSuggestions(userId);
		const preferences = await findUserExclusions(userId);
		await applyAiSuggestions(
			userId,
			stillPending,
			projects,
			preferences?.aiLabelingEnabled ?? false,
		);

		return listActivitySessionsInRange(userId, from, to, null, 500);
	});

const confirmEntrySchema = z.object({
	id: z.uuid(),
	finalLabel: z.string().trim().min(1).max(160),
	projectId: z.uuid().nullable(),
});

export const confirmActivitySessions = protectedProcedure
	.input(z.object({ entries: z.array(confirmEntrySchema).min(1).max(200) }))
	.handler(async ({ input, context }) => {
		const userId = context.session.user.id;
		const sessions = await findActivitySessionsForUser(
			userId,
			input.entries.map((entry) => entry.id),
		);
		const sessionsById = new Map(
			sessions.map((session) => [session.id, session]),
		);

		const confirmedAt = new Date();
		const confirmationRows = [];

		for (const entry of input.entries) {
			const session = sessionsById.get(entry.id);
			if (session === undefined) {
				throwAsOrpcError(new ActivitySessionNotFoundError(entry.id));
			}
			if (session.status === SESSION_STATUS.CONFIRMED) {
				throwAsOrpcError(new ActivitySessionAlreadyConfirmedError(entry.id));
			}

			const edited =
				entry.finalLabel !== session.suggestedLabel ||
				entry.projectId !== session.projectId;

			await updateActivitySessionForUser(userId, entry.id, {
				status: SESSION_STATUS.CONFIRMED,
				finalLabel: entry.finalLabel,
				projectId: entry.projectId,
				edited,
				confirmedAt,
			});

			confirmationRows.push({
				userId,
				activitySessionId: entry.id,
				signalFingerprint: session.signalFingerprint,
				finalLabel: entry.finalLabel,
				finalProjectId: entry.projectId,
				suggestedLabel: session.suggestedLabel,
				suggestedProjectId: session.projectId,
				suggestionSource: session.suggestionSource,
				confidencePercent: session.confidencePercent,
				edited,
				confirmedAt,
			});
		}

		await insertConfirmations(confirmationRows);
		return { confirmedCount: confirmationRows.length };
	});

export const mergeActivitySessions = protectedProcedure
	.input(z.object({ sessionIds: z.array(z.uuid()).min(2).max(50) }))
	.handler(async ({ input, context }) => {
		const userId = context.session.user.id;
		const sessions = await findActivitySessionsForUser(
			userId,
			input.sessionIds,
		);
		if (sessions.length !== input.sessionIds.length) {
			throwAsOrpcError(
				new ActivitySessionNotFoundError(input.sessionIds[0] ?? ""),
			);
		}

		const ordered = [...sessions].sort(
			(left, right) => left.startedAt.getTime() - right.startedAt.getTime(),
		);
		for (let index = 1; index < ordered.length; index += 1) {
			const previous = ordered[index - 1];
			const current = ordered[index];
			if (
				previous === undefined ||
				current === undefined ||
				previous.endedAt > current.startedAt
			) {
				throwAsOrpcError(new ActivitySessionNotAdjacentError());
			}
		}

		const first = ordered[0];
		if (first === undefined) {
			throwAsOrpcError(new ActivitySessionNotAdjacentError());
		}
		const last = ordered[ordered.length - 1];
		const startedAt = first.startedAt;
		const endedAt = last?.endedAt ?? first.endedAt;
		const commitSubjects = [
			...new Set(ordered.flatMap((session) => session.commitSubjects)),
		];

		const merged = await insertActivitySession({
			userId,
			startedAt,
			endedAt,
			durationSeconds: secondsBetween(startedAt, endedAt),
			appName: first.appName,
			windowTitle: first.windowTitle,
			repoName: first.repoName,
			branchName: first.branchName,
			commitSubjects,
			signalFingerprint: first.signalFingerprint,
			suggestedLabel: first.suggestedLabel,
			suggestedProjectId: first.projectId,
			suggestionSource: first.suggestionSource,
			suggestionRationale: first.suggestionRationale,
			confidencePercent: first.confidencePercent,
		});

		await archiveActivitySessionsForUser(userId, input.sessionIds, new Date());
		return merged;
	});

export const splitActivitySession = protectedProcedure
	.input(z.object({ id: z.uuid(), splitAt: z.coerce.date() }))
	.handler(async ({ input, context }) => {
		const userId = context.session.user.id;
		const session = await findActivitySessionForUser(userId, input.id);
		if (session === null) {
			throwAsOrpcError(new ActivitySessionNotFoundError(input.id));
		}
		if (
			input.splitAt <= session.startedAt ||
			input.splitAt >= session.endedAt
		) {
			throwAsOrpcError(new ActivitySessionSplitOutOfRangeError());
		}

		const firstHalf = await insertActivitySession({
			userId,
			startedAt: session.startedAt,
			endedAt: input.splitAt,
			durationSeconds: secondsBetween(session.startedAt, input.splitAt),
			appName: session.appName,
			windowTitle: session.windowTitle,
			repoName: session.repoName,
			branchName: session.branchName,
			commitSubjects: session.commitSubjects,
			signalFingerprint: session.signalFingerprint,
			suggestedLabel: session.suggestedLabel,
			suggestedProjectId: session.projectId,
			suggestionSource: session.suggestionSource,
			suggestionRationale: session.suggestionRationale,
			confidencePercent: session.confidencePercent,
		});

		const secondHalf = await insertActivitySession({
			userId,
			startedAt: input.splitAt,
			endedAt: session.endedAt,
			durationSeconds: secondsBetween(input.splitAt, session.endedAt),
			appName: session.appName,
			windowTitle: session.windowTitle,
			repoName: session.repoName,
			branchName: session.branchName,
			commitSubjects: [],
			signalFingerprint: session.signalFingerprint,
			suggestedLabel: session.suggestedLabel,
			suggestedProjectId: session.projectId,
			suggestionSource: session.suggestionSource,
			suggestionRationale: session.suggestionRationale,
			confidencePercent: session.confidencePercent,
		});

		await archiveActivitySessionsForUser(userId, [input.id], new Date());
		return { firstHalf, secondHalf };
	});

export const requestAiSuggestions = protectedProcedure
	.input(
		z.object({
			sessionIds: z.array(z.uuid()).min(1).max(AI_SUGGESTION_BATCH_CAP),
		}),
	)
	.handler(async ({ input, context }) => {
		const userId = context.session.user.id;
		const [sessions, projects] = await Promise.all([
			findActivitySessionsForUser(userId, input.sessionIds),
			listProjectsByUser(userId),
		]);

		for (const session of sessions) {
			const suggestion = await buildAiSuggestion(labelSuggestionModel, {
				signals: {
					appName: session.appName,
					windowTitle: session.windowTitle,
					repoName: session.repoName,
					branchName: session.branchName,
				},
				durationSeconds: session.durationSeconds,
				commitSubjects: session.commitSubjects,
				knownProjects: projects,
			});
			if (suggestion !== null) {
				await updateActivitySessionForUser(userId, session.id, {
					suggestedLabel: suggestion.label,
					suggestedProjectId: suggestion.projectId,
					suggestionSource: suggestion.source,
					suggestionRationale: suggestion.rationale,
					confidencePercent: suggestion.confidencePercent,
				});
			}
		}

		return findActivitySessionsForUser(userId, input.sessionIds);
	});

export const activitySessionRouter = {
	list: listActivitySessions,
	confirm: confirmActivitySessions,
	merge: mergeActivitySessions,
	split: splitActivitySession,
	requestaisuggestions: requestAiSuggestions,
};
