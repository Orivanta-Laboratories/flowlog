import { and, eq, gte, isNull, lt, sql } from "drizzle-orm";

import type { OrgRole } from "../constants";
import { db } from "../index";
import {
	invitation,
	member,
	organization,
	session,
	user,
} from "../schema/auth";
import { activitySession } from "../schema/tracking";

export async function findMemberByUserId(userId: string) {
	const [row] = await db
		.select({
			id: member.id,
			organizationId: member.organizationId,
			userId: member.userId,
			role: member.role,
		})
		.from(member)
		.where(eq(member.userId, userId))
		.limit(1);
	return row ?? null;
}

export async function findOrganizationById(organizationId: string) {
	const [row] = await db
		.select()
		.from(organization)
		.where(eq(organization.id, organizationId))
		.limit(1);
	return row ?? null;
}

export async function listMembersWithTrackedSeconds(
	organizationId: string,
	from: Date,
	to: Date,
) {
	return db
		.select({
			memberId: member.id,
			userId: member.userId,
			role: member.role,
			name: user.name,
			email: user.email,
			joinedAt: member.createdAt,
			trackedSeconds:
				sql<number>`coalesce(sum(${activitySession.durationSeconds}), 0)`.mapWith(
					Number,
				),
		})
		.from(member)
		.innerJoin(user, eq(user.id, member.userId))
		.leftJoin(
			activitySession,
			and(
				eq(activitySession.userId, member.userId),
				isNull(activitySession.archivedAt),
				gte(activitySession.startedAt, from),
				lt(activitySession.startedAt, to),
			),
		)
		.where(eq(member.organizationId, organizationId))
		.groupBy(
			member.id,
			member.userId,
			member.role,
			user.name,
			user.email,
			member.createdAt,
		)
		.orderBy(member.createdAt);
}

export async function dailyTrackedSecondsForOrganization(
	organizationId: string,
	from: Date,
	to: Date,
) {
	return db
		.select({
			day: sql<string>`date_trunc('day', ${activitySession.startedAt})`.mapWith(
				String,
			),
			trackedSeconds:
				sql<number>`sum(${activitySession.durationSeconds})`.mapWith(Number),
		})
		.from(activitySession)
		.innerJoin(member, eq(member.userId, activitySession.userId))
		.where(
			and(
				eq(member.organizationId, organizationId),
				isNull(activitySession.archivedAt),
				gte(activitySession.startedAt, from),
				lt(activitySession.startedAt, to),
			),
		)
		.groupBy(sql`date_trunc('day', ${activitySession.startedAt})`)
		.orderBy(sql`date_trunc('day', ${activitySession.startedAt})`);
}

export async function findPendingInvitationByEmail(email: string) {
	const [row] = await db
		.select()
		.from(invitation)
		.where(
			and(
				eq(invitation.email, email.toLowerCase()),
				eq(invitation.status, "pending"),
			),
		)
		.orderBy(invitation.createdAt)
		.limit(1);
	return row ?? null;
}

export async function markInvitationAccepted(invitationId: string) {
	await db
		.update(invitation)
		.set({ status: "accepted" })
		.where(eq(invitation.id, invitationId));
}

async function healSessionsMissingActiveOrganization(
	userId: string,
	organizationId: string,
) {
	await db
		.update(session)
		.set({ activeOrganizationId: organizationId })
		.where(
			and(eq(session.userId, userId), isNull(session.activeOrganizationId)),
		);
}

export async function createOrganizationWithOwner(params: {
	organizationId: string;
	name: string;
	slug: string;
	memberId: string;
	userId: string;
	ownerRole: OrgRole;
}) {
	await db.insert(organization).values({
		id: params.organizationId,
		name: params.name,
		slug: params.slug,
	});
	await db.insert(member).values({
		id: params.memberId,
		organizationId: params.organizationId,
		userId: params.userId,
		role: params.ownerRole,
	});
	await healSessionsMissingActiveOrganization(
		params.userId,
		params.organizationId,
	);
}

export async function joinOrganizationViaInvitation(params: {
	memberId: string;
	organizationId: string;
	userId: string;
	role: OrgRole;
	invitationId: string;
}) {
	await db.insert(member).values({
		id: params.memberId,
		organizationId: params.organizationId,
		userId: params.userId,
		role: params.role,
	});
	await markInvitationAccepted(params.invitationId);
	await healSessionsMissingActiveOrganization(
		params.userId,
		params.organizationId,
	);
}

export async function listPendingInvitationsForOrganization(
	organizationId: string,
) {
	return db
		.select({
			id: invitation.id,
			email: invitation.email,
			role: invitation.role,
			expiresAt: invitation.expiresAt,
			createdAt: invitation.createdAt,
		})
		.from(invitation)
		.where(
			and(
				eq(invitation.organizationId, organizationId),
				eq(invitation.status, "pending"),
			),
		)
		.orderBy(invitation.createdAt);
}
