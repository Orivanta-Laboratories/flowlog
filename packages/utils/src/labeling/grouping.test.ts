import assert from "node:assert/strict";
import { test } from "node:test";

import {
	corroboratingTokens,
	type GroupableSession,
	groupSessionsByBranchContext,
	humanizeBranchName,
	tokenizeBranchName,
} from "./grouping";

let clock = new Date("2026-09-10T09:00:00.000Z");

function session(
	overrides: Partial<GroupableSession> & {
		minutes?: number;
		gapMinutes?: number;
	} = {},
): GroupableSession {
	const { minutes = 10, gapMinutes = 0, ...rest } = overrides;
	const startedAt = new Date(clock.getTime() + gapMinutes * 60_000);
	const endedAt = new Date(startedAt.getTime() + minutes * 60_000);
	clock = endedAt;
	return {
		id: `session-${startedAt.toISOString()}`,
		startedAt,
		endedAt,
		durationSeconds: minutes * 60,
		appName: "code",
		windowTitle: "auth.ts — flowlog",
		repoName: "flowlog",
		branchName: "ft/implement-signin",
		...rest,
	};
}

function reset() {
	clock = new Date("2026-09-10T09:00:00.000Z");
}

test("tokenizeBranchName drops the branch type prefix and short noise", () => {
	assert.deepEqual(tokenizeBranchName("ft/implement-signin"), [
		"implement",
		"signin",
	]);
	assert.deepEqual(tokenizeBranchName("feature/org-invites"), [
		"org",
		"invites",
	]);
});

test("humanizeBranchName turns a slug into a readable label", () => {
	assert.equal(humanizeBranchName("ft/implement-signin"), "Implement signin");
});

test("corroboratingTokens matches branch words inside a tab title", () => {
	reset();
	const tab = session({
		appName: "better-auth.com",
		windowTitle: "Email and Password — Better Auth",
		repoName: null,
		branchName: null,
	});
	assert.deepEqual(corroboratingTokens(tab, ["implement", "signin"]), []);

	const googleTab = session({
		appName: "google.com",
		windowTitle: "better auth google sign in oauth",
		repoName: null,
		branchName: null,
	});
	assert.deepEqual(corroboratingTokens(googleTab, ["implement", "signin"]), [
		"signin",
	]);
});

test("corroboratingTokens treats localhost as its own signal", () => {
	reset();
	const local = session({
		appName: "localhost",
		windowTitle: "Sign in",
		repoName: null,
		branchName: null,
	});
	assert.deepEqual(corroboratingTokens(local, ["implement"]), ["localhost"]);
});

test("browser research between two branch spans joins the branch group", () => {
	reset();
	const editorBefore = session({ minutes: 15 });
	const docs = session({
		minutes: 7,
		appName: "better-auth.com",
		windowTitle: "Sign in — Better Auth",
		repoName: null,
		branchName: null,
	});
	const localhost = session({
		minutes: 4,
		appName: "localhost",
		windowTitle: "Sign in — Flowlog",
		repoName: null,
		branchName: null,
	});
	const editorAfter = session({ minutes: 20 });

	const groups = groupSessionsByBranchContext([
		editorBefore,
		docs,
		localhost,
		editorAfter,
	]);

	assert.equal(groups.length, 1);
	const group = groups[0];
	assert.equal(group?.branchName, "ft/implement-signin");
	assert.deepEqual(
		group?.members.map((member) => member.session.id),
		[editorBefore.id, docs.id, localhost.id, editorAfter.id],
	);
	assert.equal(group?.totalSeconds, (15 + 7 + 4 + 20) * 60);
	assert.deepEqual(group?.members[2]?.corroboratingTokens, ["signin"]);
});

test("a switch to another branch starts a new group", () => {
	reset();
	const signin = session({ minutes: 15 });
	const docs = session({
		minutes: 5,
		appName: "google.com",
		windowTitle: "sign in oauth",
		repoName: null,
		branchName: null,
	});
	const signinAgain = session({ minutes: 10 });
	const other = session({ minutes: 12, branchName: "fix/wayland-tracking" });
	const otherAgain = session({
		minutes: 8,
		branchName: "fix/wayland-tracking",
	});

	const groups = groupSessionsByBranchContext([
		signin,
		docs,
		signinAgain,
		other,
		otherAgain,
	]);

	assert.equal(groups.length, 2);
	assert.equal(groups[0]?.branchName, "ft/implement-signin");
	assert.equal(groups[0]?.members.length, 3);
	assert.equal(groups[1]?.branchName, "fix/wayland-tracking");
	assert.equal(groups[1]?.members.length, 2);
});

test("a long gap closes the group instead of bridging it", () => {
	reset();
	const before = session({ minutes: 15 });
	const afterLunch = session({ minutes: 15, gapMinutes: 60 });

	const groups = groupSessionsByBranchContext([before, afterLunch]);

	assert.equal(groups.length, 0);
});

test("trailing ambient time is not absorbed into the group", () => {
	reset();
	const editorBefore = session({ minutes: 15 });
	const editorAfter = session({ minutes: 15 });
	const youtube = session({
		minutes: 12,
		appName: "youtube.com",
		windowTitle: "Some video",
		repoName: null,
		branchName: null,
	});

	const groups = groupSessionsByBranchContext([
		editorBefore,
		editorAfter,
		youtube,
	]);

	assert.equal(groups.length, 1);
	assert.deepEqual(
		groups[0]?.members.map((member) => member.session.id),
		[editorBefore.id, editorAfter.id],
	);
});

test("uncorroborated activity breaks a branch group", () => {
	reset();
	const editorBefore = session({ minutes: 15 });
	const youtube = session({
		minutes: 6,
		appName: "youtube.com",
		windowTitle: "Some video",
		repoName: null,
		branchName: null,
	});
	const editorAfter = session({ minutes: 15 });

	const groups = groupSessionsByBranchContext([
		editorBefore,
		youtube,
		editorAfter,
	]);

	assert.equal(groups.length, 0);
});

test("a lone branch span is not a group", () => {
	reset();
	const groups = groupSessionsByBranchContext([session({ minutes: 30 })]);
	assert.equal(groups.length, 0);
});

test("overlapping sessions cannot inflate a branch group", () => {
	reset();
	const first = session({ minutes: 15 });
	const overlapping = session({ minutes: 15, gapMinutes: -10 });
	assert.equal(groupSessionsByBranchContext([first, overlapping]).length, 0);
});
