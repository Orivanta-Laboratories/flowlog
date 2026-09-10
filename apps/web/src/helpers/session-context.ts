import type { AppRouterClient } from "@flowlog/api/routers/index";

export type ActivitySessionRow = Awaited<
	ReturnType<AppRouterClient["activitysession"]["list"]>
>[number];

const HIGH_CONFIDENCE_THRESHOLD_PERCENT = 80;

export function isHighConfidenceSession(session: ActivitySessionRow): boolean {
	return (
		session.status !== "CONFIRMED" &&
		session.confidencePercent >= HIGH_CONFIDENCE_THRESHOLD_PERCENT
	);
}

export function describeSessionContext(session: ActivitySessionRow): string {
	if (session.branchName !== null && session.repoName !== null) {
		return `${session.appName} · ${session.repoName} · ${session.branchName}`;
	}
	if (session.repoName !== null) {
		return `${session.appName} · ${session.repoName}`;
	}
	if (session.windowTitle !== null) {
		return `${session.appName} · ${session.windowTitle}`;
	}
	return session.appName;
}

export function describeSuggestionSource(
	source: ActivitySessionRow["suggestionSource"],
): string {
	switch (source) {
		case "RULE":
			return "your rule";
		case "HISTORY":
			return "past labels";
		case "AI":
			return "AI suggestion";
		default:
			return "no suggestion yet";
	}
}
