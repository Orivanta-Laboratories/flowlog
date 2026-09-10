import type { ActivitySessionRow } from "./session-context";

export type SessionDraft = {
	finalLabel: string;
	projectId: string | null;
};

export type SessionDraftMap = Record<string, SessionDraft>;

export function draftFromSession(session: ActivitySessionRow): SessionDraft {
	if (session.status === "CONFIRMED") {
		return {
			finalLabel: session.finalLabel ?? "",
			projectId: session.projectId,
		};
	}
	return {
		finalLabel: session.suggestedLabel ?? "",
		projectId: session.projectId,
	};
}

export function withMissingDrafts(
	drafts: SessionDraftMap,
	sessions: readonly ActivitySessionRow[],
): SessionDraftMap {
	const next: SessionDraftMap = { ...drafts };
	let changed = false;
	for (const session of sessions) {
		if (next[session.id] === undefined) {
			next[session.id] = draftFromSession(session);
			changed = true;
		}
	}
	return changed ? next : drafts;
}
