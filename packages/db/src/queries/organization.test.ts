import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

dotenv.config({
	path: fileURLToPath(new URL("../../../../apps/server/.env", import.meta.url)),
});

const { eq } = await import("drizzle-orm");
const { db } = await import("../index");
const { ORG_ROLE, INVITATION_STATUS } = await import("../constants");
const { organization, member, invitation, user } = await import(
	"../schema/auth"
);
const { activitySession } = await import("../schema/tracking");
const {
	findMemberByUserId,
	findOrganizationById,
	findPendingInvitationByEmail,
	createOrganizationWithOwner,
	joinOrganizationViaInvitation,
	listMembersWithTrackedSeconds,
	dailyTrackedSecondsForOrganization,
} = await import("./organization");

const TEST_EMAIL_DOMAIN = "flowlog-org-test.local";

function testEmail() {
	return `${randomUUID()}@${TEST_EMAIL_DOMAIN}`;
}

async function insertTestUser(name: string) {
	const id = randomUUID();
	await db.insert(user).values({
		id,
		name,
		email: testEmail(),
	});
	return id;
}

async function deleteTestUsers(userIds: string[]) {
	if (userIds.length === 0) return;
	for (const id of userIds) {
		await db.delete(user).where(eq(user.id, id));
	}
}

async function deleteTestOrganizations(organizationIds: string[]) {
	if (organizationIds.length === 0) return;
	for (const id of organizationIds) {
		await db.delete(organization).where(eq(organization.id, id));
	}
}

async function deleteTestMembers(memberIds: string[]) {
	if (memberIds.length === 0) return;
	for (const id of memberIds) {
		await db.delete(member).where(eq(member.id, id));
	}
}

async function deleteTestInvitations(invitationIds: string[]) {
	if (invitationIds.length === 0) return;
	for (const id of invitationIds) {
		await db.delete(invitation).where(eq(invitation.id, id));
	}
}

async function deleteTestActivitySessions(activitySessionIds: string[]) {
	if (activitySessionIds.length === 0) return;
	for (const id of activitySessionIds) {
		await db.delete(activitySession).where(eq(activitySession.id, id));
	}
}

test("member.userId has a database-level constraint enforcing one organization per user", async () => {
	const userId = await insertTestUser("Constraint Test User");
	const org1Id = randomUUID();
	const org2Id = randomUUID();
	const member1Id = randomUUID();

	try {
		await createOrganizationWithOwner({
			organizationId: org1Id,
			name: "Org One",
			slug: `org-one-${org1Id}`,
			memberId: member1Id,
			userId,
			ownerRole: ORG_ROLE.OWNER,
		});

		await db.insert(organization).values({
			id: org2Id,
			name: "Org Two",
			slug: `org-two-${org2Id}`,
		});

		await assert.rejects(() =>
			db.insert(member).values({
				id: randomUUID(),
				organizationId: org2Id,
				userId,
				role: ORG_ROLE.MEMBER,
			}),
		);
	} finally {
		await deleteTestMembers([member1Id]);
		await deleteTestOrganizations([org1Id, org2Id]);
		await deleteTestUsers([userId]);
	}
});

test("createOrganizationWithOwner creates both the organization and the owner membership row", async () => {
	const userId = await insertTestUser("Owner Creation User");
	const organizationId = randomUUID();
	const memberId = randomUUID();

	try {
		await createOrganizationWithOwner({
			organizationId,
			name: "Owner Creation Org",
			slug: `owner-creation-org-${organizationId}`,
			memberId,
			userId,
			ownerRole: ORG_ROLE.OWNER,
		});

		const org = await findOrganizationById(organizationId);
		assert.ok(org);
		assert.equal(org?.name, "Owner Creation Org");

		const membership = await findMemberByUserId(userId);
		assert.ok(membership);
		assert.equal(membership?.organizationId, organizationId);
		assert.equal(membership?.role, ORG_ROLE.OWNER);
	} finally {
		await deleteTestMembers([memberId]);
		await deleteTestOrganizations([organizationId]);
		await deleteTestUsers([userId]);
	}
});

test("joinOrganizationViaInvitation creates the member row and marks the invitation accepted", async () => {
	const ownerId = await insertTestUser("Inviting Owner");
	const joinerId = await insertTestUser("Invitation Joiner");
	const organizationId = randomUUID();
	const ownerMemberId = randomUUID();
	const joinerMemberId = randomUUID();
	const invitationId = randomUUID();
	const inviteEmail = testEmail();

	try {
		await createOrganizationWithOwner({
			organizationId,
			name: "Invitation Org",
			slug: `invitation-org-${organizationId}`,
			memberId: ownerMemberId,
			userId: ownerId,
			ownerRole: ORG_ROLE.OWNER,
		});

		await db.insert(invitation).values({
			id: invitationId,
			organizationId,
			email: inviteEmail,
			role: ORG_ROLE.MEMBER,
			status: INVITATION_STATUS.PENDING,
			inviterId: ownerId,
			expiresAt: new Date(Date.now() + 60 * 60 * 1000),
		});

		await joinOrganizationViaInvitation({
			memberId: joinerMemberId,
			organizationId,
			userId: joinerId,
			role: ORG_ROLE.MEMBER,
			invitationId,
		});

		const membership = await findMemberByUserId(joinerId);
		assert.ok(membership);
		assert.equal(membership?.organizationId, organizationId);
		assert.equal(membership?.role, ORG_ROLE.MEMBER);

		const stillPending = await findPendingInvitationByEmail(inviteEmail);
		assert.equal(stillPending, null);
	} finally {
		await deleteTestMembers([ownerMemberId, joinerMemberId]);
		await deleteTestInvitations([invitationId]);
		await deleteTestOrganizations([organizationId]);
		await deleteTestUsers([ownerId, joinerId]);
	}
});

test("findPendingInvitationByEmail only returns pending invitations and is case-insensitive", async () => {
	const ownerId = await insertTestUser("Pending Lookup Owner");
	const organizationId = randomUUID();
	const ownerMemberId = randomUUID();
	const acceptedInvitationId = randomUUID();
	const pendingInvitationId = randomUUID();
	const acceptedEmail = testEmail();
	const pendingEmailLowercase = testEmail();

	try {
		await createOrganizationWithOwner({
			organizationId,
			name: "Pending Lookup Org",
			slug: `pending-lookup-org-${organizationId}`,
			memberId: ownerMemberId,
			userId: ownerId,
			ownerRole: ORG_ROLE.OWNER,
		});

		await db.insert(invitation).values({
			id: acceptedInvitationId,
			organizationId,
			email: acceptedEmail,
			role: ORG_ROLE.MEMBER,
			status: INVITATION_STATUS.ACCEPTED,
			inviterId: ownerId,
			expiresAt: new Date(Date.now() + 60 * 60 * 1000),
		});

		const foundAccepted = await findPendingInvitationByEmail(acceptedEmail);
		assert.equal(foundAccepted, null);

		await db.insert(invitation).values({
			id: pendingInvitationId,
			organizationId,
			email: pendingEmailLowercase,
			role: ORG_ROLE.MEMBER,
			status: INVITATION_STATUS.PENDING,
			inviterId: ownerId,
			expiresAt: new Date(Date.now() + 60 * 60 * 1000),
		});

		const foundWithMixedCase = await findPendingInvitationByEmail(
			pendingEmailLowercase.toUpperCase(),
		);
		assert.ok(foundWithMixedCase);
		assert.equal(foundWithMixedCase?.id, pendingInvitationId);
	} finally {
		await deleteTestInvitations([acceptedInvitationId, pendingInvitationId]);
		await deleteTestMembers([ownerMemberId]);
		await deleteTestOrganizations([organizationId]);
		await deleteTestUsers([ownerId]);
	}
});

test("listMembersWithTrackedSeconds sums in-range sessions per member and reports zero for no activity", async () => {
	const activeUserId = await insertTestUser("Active Tracked User");
	const idleUserId = await insertTestUser("Idle Tracked User");
	const organizationId = randomUUID();
	const activeMemberId = randomUUID();
	const idleMemberId = randomUUID();
	const sessionIds: string[] = [];

	const from = new Date("2026-02-01T00:00:00.000Z");
	const to = new Date("2026-02-08T00:00:00.000Z");

	try {
		await createOrganizationWithOwner({
			organizationId,
			name: "Tracked Seconds Org",
			slug: `tracked-seconds-org-${organizationId}`,
			memberId: activeMemberId,
			userId: activeUserId,
			ownerRole: ORG_ROLE.OWNER,
		});
		await db.insert(member).values({
			id: idleMemberId,
			organizationId,
			userId: idleUserId,
			role: ORG_ROLE.MEMBER,
		});

		const inRangeIncluded = await db
			.insert(activitySession)
			.values([
				{
					userId: activeUserId,
					startedAt: new Date("2026-02-02T09:00:00.000Z"),
					endedAt: new Date("2026-02-02T09:10:00.000Z"),
					durationSeconds: 600,
					appName: "Code",
					signalFingerprint: randomUUID(),
				},
				{
					userId: activeUserId,
					startedAt: new Date("2026-02-03T09:00:00.000Z"),
					endedAt: new Date("2026-02-03T09:05:00.000Z"),
					durationSeconds: 300,
					appName: "Code",
					signalFingerprint: randomUUID(),
				},
			])
			.returning({ id: activitySession.id });
		sessionIds.push(...inRangeIncluded.map((row) => row.id));

		const archived = await db
			.insert(activitySession)
			.values({
				userId: activeUserId,
				startedAt: new Date("2026-02-04T09:00:00.000Z"),
				endedAt: new Date("2026-02-04T09:20:00.000Z"),
				durationSeconds: 999,
				appName: "Code",
				signalFingerprint: randomUUID(),
				archivedAt: new Date(),
			})
			.returning({ id: activitySession.id });
		sessionIds.push(...archived.map((row) => row.id));

		const outOfRange = await db
			.insert(activitySession)
			.values({
				userId: activeUserId,
				startedAt: new Date("2026-01-15T09:00:00.000Z"),
				endedAt: new Date("2026-01-15T09:10:00.000Z"),
				durationSeconds: 500,
				appName: "Code",
				signalFingerprint: randomUUID(),
			})
			.returning({ id: activitySession.id });
		sessionIds.push(...outOfRange.map((row) => row.id));

		const rows = await listMembersWithTrackedSeconds(organizationId, from, to);

		const activeRow = rows.find((row) => row.userId === activeUserId);
		const idleRow = rows.find((row) => row.userId === idleUserId);

		assert.ok(activeRow);
		assert.equal(activeRow?.trackedSeconds, 900);

		assert.ok(idleRow);
		assert.equal(idleRow?.trackedSeconds, 0);
	} finally {
		await deleteTestActivitySessions(sessionIds);
		await deleteTestMembers([activeMemberId, idleMemberId]);
		await deleteTestOrganizations([organizationId]);
		await deleteTestUsers([activeUserId, idleUserId]);
	}
});

test("dailyTrackedSecondsForOrganization groups tracked seconds by day across members", async () => {
	const userAId = await insertTestUser("Daily Grouping User A");
	const userBId = await insertTestUser("Daily Grouping User B");
	const organizationId = randomUUID();
	const memberAId = randomUUID();
	const memberBId = randomUUID();
	const sessionIds: string[] = [];

	const from = new Date("2026-03-01T00:00:00.000Z");
	const to = new Date("2026-03-05T00:00:00.000Z");

	try {
		await createOrganizationWithOwner({
			organizationId,
			name: "Daily Grouping Org",
			slug: `daily-grouping-org-${organizationId}`,
			memberId: memberAId,
			userId: userAId,
			ownerRole: ORG_ROLE.OWNER,
		});
		await db.insert(member).values({
			id: memberBId,
			organizationId,
			userId: userBId,
			role: ORG_ROLE.MEMBER,
		});

		const inserted = await db
			.insert(activitySession)
			.values([
				{
					userId: userAId,
					startedAt: new Date("2026-03-01T10:00:00.000Z"),
					endedAt: new Date("2026-03-01T10:10:00.000Z"),
					durationSeconds: 600,
					appName: "Code",
					signalFingerprint: randomUUID(),
				},
				{
					userId: userBId,
					startedAt: new Date("2026-03-01T11:00:00.000Z"),
					endedAt: new Date("2026-03-01T11:05:00.000Z"),
					durationSeconds: 300,
					appName: "Code",
					signalFingerprint: randomUUID(),
				},
				{
					userId: userAId,
					startedAt: new Date("2026-03-03T10:00:00.000Z"),
					endedAt: new Date("2026-03-03T10:07:00.000Z"),
					durationSeconds: 420,
					appName: "Code",
					signalFingerprint: randomUUID(),
				},
			])
			.returning({ id: activitySession.id });
		sessionIds.push(...inserted.map((row) => row.id));

		const rows = await dailyTrackedSecondsForOrganization(
			organizationId,
			from,
			to,
		);

		const dayOne = rows.find(
			(row) => new Date(row.day).toISOString().slice(0, 10) === "2026-03-01",
		);
		const dayThree = rows.find(
			(row) => new Date(row.day).toISOString().slice(0, 10) === "2026-03-03",
		);

		assert.ok(dayOne);
		assert.equal(dayOne?.trackedSeconds, 900);

		assert.ok(dayThree);
		assert.equal(dayThree?.trackedSeconds, 420);
	} finally {
		await deleteTestActivitySessions(sessionIds);
		await deleteTestMembers([memberAId, memberBId]);
		await deleteTestOrganizations([organizationId]);
		await deleteTestUsers([userAId, userBId]);
	}
});
