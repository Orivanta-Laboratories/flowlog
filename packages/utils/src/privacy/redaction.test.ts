import assert from "node:assert/strict";
import { test } from "node:test";

import {
	isExcludedActivity,
	matchesAnyPattern,
	redactSensitiveText,
} from "./redaction";

test("redactSensitiveText removes email addresses", () => {
	assert.equal(
		redactSensitiveText("Inbox — ada@example.com"),
		"Inbox — [redacted]",
	);
});

test("redactSensitiveText keeps the url origin and drops the query string", () => {
	assert.equal(
		redactSensitiveText("https://app.acme.com/orders?token=abc123def"),
		"https://app.acme.com/orders",
	);
});

test("redactSensitiveText removes long digit runs such as account numbers", () => {
	assert.equal(
		redactSensitiveText("Statement 4929123456789"),
		"Statement [redacted]",
	);
});

test("redactSensitiveText removes credential-looking key value pairs", () => {
	assert.equal(redactSensitiveText("api_key=sk-live-9f2"), "[redacted]");
});

test("redactSensitiveText passes through a plain title unchanged", () => {
	assert.equal(
		redactSensitiveText("checkout.ts — acme-app — Visual Studio Code"),
		"checkout.ts — acme-app — Visual Studio Code",
	);
});

test("redactSensitiveText returns null for a missing title", () => {
	assert.equal(redactSensitiveText(null), null);
});

test("matchesAnyPattern supports wildcards and is case insensitive", () => {
	assert.equal(matchesAnyPattern("1Password", ["1password"]), true);
	assert.equal(matchesAnyPattern("Bitwarden — Vault", ["*vault*"]), true);
	assert.equal(matchesAnyPattern("Visual Studio Code", ["*vault*"]), false);
});

test("isExcludedActivity excludes on app name and on window title", () => {
	const exclusions = {
		appNames: ["1Password"],
		titlePatterns: ["*online banking*"],
	};
	assert.equal(
		isExcludedActivity({ appName: "1Password", windowTitle: null }, exclusions),
		true,
	);
	assert.equal(
		isExcludedActivity(
			{ appName: "Firefox", windowTitle: "My Online Banking - Accounts" },
			exclusions,
		),
		true,
	);
	assert.equal(
		isExcludedActivity(
			{ appName: "Firefox", windowTitle: "Docs — MDN" },
			exclusions,
		),
		false,
	);
});
