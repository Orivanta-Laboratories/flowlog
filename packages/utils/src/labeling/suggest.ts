import { SUGGESTION_SOURCE, type SuggestionSource } from "@flowlog/db/constants";

import type { ActivitySignals } from "./fingerprint";
import { findMatchingRule, type MatchingRuleCandidate } from "./rules";

export const RULE_CONFIDENCE_PERCENT = 98;
export const HISTORY_CONFIDENCE_PERCENT = 92;
export const HIGH_CONFIDENCE_THRESHOLD_PERCENT = 80;

export type LabelSuggestion = {
	label: string;
	projectId: string | null;
	confidencePercent: number;
	source: SuggestionSource;
	rationale: string;
};

export type HistoryMatch = {
	finalLabel: string;
	finalProjectId: string | null;
};

export function deriveFallbackLabel(signals: ActivitySignals): string {
	if (signals.branchName !== null && signals.repoName !== null) {
		return `${signals.repoName} · ${signals.branchName}`;
	}
	if (signals.repoName !== null) {
		return signals.repoName;
	}
	return signals.appName;
}

export function buildRuleSuggestion(
	signals: ActivitySignals,
	rules: readonly MatchingRuleCandidate[],
): LabelSuggestion | null {
	const rule = findMatchingRule(signals, rules);
	if (rule === null) {
		return null;
	}
	return {
		label: rule.label ?? deriveFallbackLabel(signals),
		projectId: rule.projectId,
		confidencePercent: RULE_CONFIDENCE_PERCENT,
		source: SUGGESTION_SOURCE.RULE,
		rationale: `Matched your rule ${rule.field} ${rule.operator} "${rule.value}" for ${rule.projectName}.`,
	};
}

export function buildHistorySuggestion(match: HistoryMatch | null): LabelSuggestion | null {
	if (match === null) {
		return null;
	}
	return {
		label: match.finalLabel,
		projectId: match.finalProjectId,
		confidencePercent: HISTORY_CONFIDENCE_PERCENT,
		source: SUGGESTION_SOURCE.HISTORY,
		rationale: "You labelled the same app, repository and branch this way before.",
	};
}

export function isHighConfidence(suggestion: LabelSuggestion | null): boolean {
	return suggestion !== null && suggestion.confidencePercent >= HIGH_CONFIDENCE_THRESHOLD_PERCENT;
}

export function selectLocalSuggestion(
	signals: ActivitySignals,
	rules: readonly MatchingRuleCandidate[],
	historyMatch: HistoryMatch | null,
): LabelSuggestion | null {
	return buildRuleSuggestion(signals, rules) ?? buildHistorySuggestion(historyMatch);
}
