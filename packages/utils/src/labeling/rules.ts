import {
	RULE_FIELD,
	RULE_OPERATOR,
	type RuleField,
	type RuleOperator,
} from "@flowlog/db/constants";

import { globToRegExp } from "../privacy/redaction";
import type { ActivitySignals } from "./fingerprint";

export type MatchingRuleCandidate = {
	id: string;
	projectId: string;
	projectName: string;
	field: RuleField;
	operator: RuleOperator;
	value: string;
	label: string | null;
	priority: number;
};

function readSignalField(
	signals: ActivitySignals,
	field: RuleField,
): string | null {
	switch (field) {
		case RULE_FIELD.APP_NAME:
			return signals.appName;
		case RULE_FIELD.REPO_NAME:
			return signals.repoName;
		case RULE_FIELD.BRANCH_NAME:
			return signals.branchName;
		case RULE_FIELD.WINDOW_TITLE:
			return signals.windowTitle;
	}
}

function satisfiesOperator(
	candidateValue: string,
	ruleValue: string,
	operator: RuleOperator,
) {
	const haystack = candidateValue.toLowerCase();
	const needle = ruleValue.toLowerCase();
	switch (operator) {
		case RULE_OPERATOR.EQUALS:
			return haystack === needle;
		case RULE_OPERATOR.CONTAINS:
			return haystack.includes(needle);
		case RULE_OPERATOR.GLOB:
			return globToRegExp(needle).test(haystack);
	}
}

export function ruleMatchesSignals(
	rule: MatchingRuleCandidate,
	signals: ActivitySignals,
): boolean {
	const candidateValue = readSignalField(signals, rule.field);
	if (candidateValue === null || candidateValue === "") {
		return false;
	}
	return satisfiesOperator(candidateValue, rule.value, rule.operator);
}

export function findMatchingRule(
	signals: ActivitySignals,
	rules: readonly MatchingRuleCandidate[],
): MatchingRuleCandidate | null {
	const matches = rules.filter((rule) => ruleMatchesSignals(rule, signals));
	const ranked = [...matches].sort(
		(left, right) =>
			right.priority - left.priority || right.value.length - left.value.length,
	);
	return ranked[0] ?? null;
}
