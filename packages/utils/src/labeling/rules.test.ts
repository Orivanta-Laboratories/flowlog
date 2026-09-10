import assert from "node:assert/strict";
import { test } from "node:test";

import {
	findMatchingRule,
	type MatchingRuleCandidate,
	ruleMatchesSignals,
} from "./rules";

function rule(
	overrides: Partial<MatchingRuleCandidate> = {},
): MatchingRuleCandidate {
	return {
		id: "rule-1",
		projectId: "project-1",
		projectName: "Acme",
		field: "BRANCH_NAME",
		operator: "CONTAINS",
		value: "acme",
		label: null,
		priority: 0,
		...overrides,
	};
}

const baseSignals = {
	appName: "Code",
	windowTitle: "checkout.ts — acme-app",
	repoName: "acme-app",
	branchName: "feature/acme-checkout",
};

test("ruleMatchesSignals matches a CONTAINS rule case-insensitively", () => {
	assert.equal(ruleMatchesSignals(rule({ value: "ACME" }), baseSignals), true);
});

test("ruleMatchesSignals rejects when the field is null", () => {
	assert.equal(
		ruleMatchesSignals(rule({ field: "REPO_NAME", value: "x" }), {
			...baseSignals,
			repoName: null,
		}),
		false,
	);
});

test("ruleMatchesSignals supports GLOB operator", () => {
	assert.equal(
		ruleMatchesSignals(
			rule({ operator: "GLOB", value: "bugfix/*" }),
			baseSignals,
		),
		false,
	);
	assert.equal(
		ruleMatchesSignals(
			rule({ operator: "GLOB", value: "feature/*" }),
			baseSignals,
		),
		true,
	);
});

test("ruleMatchesSignals supports EQUALS operator", () => {
	assert.equal(
		ruleMatchesSignals(
			rule({ operator: "EQUALS", value: "Code", field: "APP_NAME" }),
			baseSignals,
		),
		true,
	);
	assert.equal(
		ruleMatchesSignals(
			rule({ operator: "EQUALS", value: "cod", field: "APP_NAME" }),
			baseSignals,
		),
		false,
	);
});

test("findMatchingRule prefers higher priority when multiple rules match", () => {
	const low = rule({ id: "low", priority: 0, value: "acme" });
	const high = rule({ id: "high", priority: 5, value: "acme" });
	assert.equal(findMatchingRule(baseSignals, [low, high])?.id, "high");
});

test("findMatchingRule prefers the more specific (longer) value on a priority tie", () => {
	const broad = rule({ id: "broad", value: "acme" });
	const specific = rule({ id: "specific", value: "acme-checkout" });
	assert.equal(
		findMatchingRule(baseSignals, [broad, specific])?.id,
		"specific",
	);
});

test("findMatchingRule returns null when nothing matches", () => {
	assert.equal(
		findMatchingRule(baseSignals, [rule({ value: "unrelated" })]),
		null,
	);
});
