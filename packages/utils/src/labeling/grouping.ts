export type GroupableSession = {
	id: string;
	startedAt: Date;
	endedAt: Date;
	durationSeconds: number;
	appName: string;
	windowTitle: string | null;
	repoName: string | null;
	branchName: string | null;
};

export type GroupingOptions = {
	maxBridgeGapSeconds: number;
	minimumBranchSeconds: number;
};

export type GroupMember = {
	session: GroupableSession;
	ambient: boolean;
	corroboratingTokens: string[];
};

export type SessionGroup = {
	repoName: string;
	branchName: string;
	startedAt: Date;
	endedAt: Date;
	totalSeconds: number;
	members: GroupMember[];
};

export const DEFAULT_GROUPING_OPTIONS: GroupingOptions = {
	maxBridgeGapSeconds: 15 * 60,
	minimumBranchSeconds: 120,
};

const TOKEN_SPLIT_PATTERN = /[^a-z0-9]+/;
const NON_ALPHANUMERIC_PATTERN = /[^a-z0-9]+/g;
const TOKEN_MINIMUM_LENGTH = 3;
const BRANCH_PREFIXES = new Set([
	"feat",
	"feats",
	"feature",
	"features",
	"ft",
	"fix",
	"fixes",
	"bugfix",
	"hotfix",
	"chore",
	"refactor",
	"docs",
	"test",
	"tests",
	"spike",
	"wip",
]);
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]);

export function tokenizeBranchName(branchName: string): string[] {
	const parts = branchName
		.toLowerCase()
		.split(TOKEN_SPLIT_PATTERN)
		.filter(
			(part) =>
				part.length >= TOKEN_MINIMUM_LENGTH && !BRANCH_PREFIXES.has(part),
		);
	return [...new Set(parts)];
}

export function humanizeBranchName(branchName: string): string {
	const tokens = tokenizeBranchName(branchName);
	if (tokens.length === 0) {
		return branchName;
	}
	const [first, ...rest] = tokens;
	return [
		`${(first as string).charAt(0).toUpperCase()}${(first as string).slice(1)}`,
		...rest,
	].join(" ");
}

export function isAmbientSession(session: GroupableSession): boolean {
	return session.repoName === null || session.branchName === null;
}

function isLocalHostSession(session: GroupableSession): boolean {
	const host = session.appName.toLowerCase().split(":")[0] ?? "";
	return LOCAL_HOSTS.has(host);
}

export function corroboratingTokens(
	session: GroupableSession,
	branchTokens: readonly string[],
): string[] {
	const haystack =
		`${session.appName} ${session.windowTitle ?? ""}`.toLowerCase();
	const collapsed = haystack.replace(NON_ALPHANUMERIC_PATTERN, "");
	const matched = branchTokens.filter(
		(token) => haystack.includes(token) || collapsed.includes(token),
	);
	if (matched.length === 0 && isLocalHostSession(session)) {
		return ["localhost"];
	}
	return matched;
}

function secondsBetweenSessions(
	earlier: GroupableSession,
	later: GroupableSession,
): number {
	return Math.round(
		(later.startedAt.getTime() - earlier.endedAt.getTime()) / 1000,
	);
}

function sameBranch(left: GroupableSession, right: GroupableSession): boolean {
	return (
		left.repoName === right.repoName && left.branchName === right.branchName
	);
}

function totalSeconds(members: readonly GroupMember[]): number {
	return members.reduce(
		(sum, member) => sum + member.session.durationSeconds,
		0,
	);
}

function finalizeGroup(
	anchor: GroupableSession,
	members: GroupMember[],
	options: GroupingOptions,
): SessionGroup | null {
	while (members.length > 0 && (members.at(-1) as GroupMember).ambient) {
		members.pop();
	}
	const anchoredSeconds = totalSeconds(
		members.filter((member) => !member.ambient),
	);
	if (members.length < 2 || anchoredSeconds < options.minimumBranchSeconds) {
		return null;
	}
	return {
		repoName: anchor.repoName as string,
		branchName: anchor.branchName as string,
		startedAt: (members[0] as GroupMember).session.startedAt,
		endedAt: (members.at(-1) as GroupMember).session.endedAt,
		totalSeconds: totalSeconds(members),
		members,
	};
}

export function groupSessionsByBranchContext(
	sessions: readonly GroupableSession[],
	options: GroupingOptions = DEFAULT_GROUPING_OPTIONS,
): SessionGroup[] {
	const ordered = [...sessions].sort(
		(left, right) => left.startedAt.getTime() - right.startedAt.getTime(),
	);

	const groups: SessionGroup[] = [];
	let anchor: GroupableSession | null = null;
	let members: GroupMember[] = [];
	let branchTokens: string[] = [];

	function closeGroup() {
		if (anchor !== null) {
			const group = finalizeGroup(anchor, members, options);
			if (group !== null) {
				groups.push(group);
			}
		}
		anchor = null;
		members = [];
		branchTokens = [];
	}

	for (const session of ordered) {
		const previous = members.at(-1)?.session;
		const gapSeconds =
			previous === undefined ? 0 : secondsBetweenSessions(previous, session);

		if (
			anchor !== null &&
			(gapSeconds < 0 || gapSeconds > options.maxBridgeGapSeconds)
		) {
			closeGroup();
		}

		if (isAmbientSession(session)) {
			if (anchor !== null) {
				const tokens = corroboratingTokens(session, branchTokens);
				if (tokens.length === 0) {
					closeGroup();
					continue;
				}
				members.push({
					session,
					ambient: true,
					corroboratingTokens: tokens,
				});
			}
			continue;
		}

		if (anchor !== null && !sameBranch(anchor, session)) {
			closeGroup();
		}

		if (anchor === null) {
			anchor = session;
			branchTokens = tokenizeBranchName(session.branchName as string);
		}
		members.push({ session, ambient: false, corroboratingTokens: [] });
	}

	closeGroup();
	return groups;
}
