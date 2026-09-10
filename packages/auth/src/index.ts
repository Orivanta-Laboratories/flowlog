import { createDb } from "@flowlog/db";
import { ORG_ROLE } from "@flowlog/db/constants";
import {
	createOrganizationWithOwner,
	findMemberByUserId,
	findPendingInvitationByEmail,
	joinOrganizationViaInvitation,
} from "@flowlog/db/queries/organization";
import * as schema from "@flowlog/db/schema/auth";
import { env } from "@flowlog/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization as organizationPlugin } from "better-auth/plugins";

import { sendInvitationEmail } from "./email";

function slugify(name: string) {
	const base = name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return `${base || "team"}-${crypto.randomUUID().slice(0, 8)}`;
}

export function createAuth() {
	const db = createDb();

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",

			schema: schema,
		}),
		trustedOrigins: [env.CORS_ORIGIN],
		emailAndPassword: {
			enabled: true,
		},
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		advanced: {
			defaultCookieAttributes: {
				sameSite: "none",
				secure: true,
				httpOnly: true,
			},
		},
		databaseHooks: {
			user: {
				create: {
					after: async (createdUser) => {
						const pendingInvitation = await findPendingInvitationByEmail(
							createdUser.email,
						);

						if (pendingInvitation) {
							await joinOrganizationViaInvitation({
								memberId: crypto.randomUUID(),
								organizationId: pendingInvitation.organizationId,
								userId: createdUser.id,
								role: pendingInvitation.role,
								invitationId: pendingInvitation.id,
							});
							return;
						}

						await createOrganizationWithOwner({
							organizationId: crypto.randomUUID(),
							name: `${createdUser.name}'s team`,
							slug: slugify(createdUser.name),
							memberId: crypto.randomUUID(),
							userId: createdUser.id,
							ownerRole: ORG_ROLE.OWNER,
						});
					},
				},
			},
			session: {
				create: {
					before: async (sessionData) => {
						const activeMember = await findMemberByUserId(sessionData.userId);
						return {
							data: {
								...sessionData,
								activeOrganizationId: activeMember?.organizationId ?? null,
							},
						};
					},
				},
			},
		},
		plugins: [
			organizationPlugin({
				allowUserToCreateOrganization: false,
				creatorRole: ORG_ROLE.OWNER,
				invitationExpiresIn: 60 * 60 * 24 * 7,
				sendInvitationEmail: async (data) => {
					const acceptUrl = new URL("/login", env.CORS_ORIGIN);
					acceptUrl.searchParams.set("invite", data.id);
					acceptUrl.searchParams.set("email", data.email);
					acceptUrl.searchParams.set("org", data.organization.name);

					await sendInvitationEmail({
						to: data.email,
						organizationName: data.organization.name,
						inviterName: data.inviter.user.name,
						acceptUrl: acceptUrl.toString(),
					});
				},
				organizationHooks: {
					beforeCreateInvitation: async (data) => {
						if (data.invitation.role !== ORG_ROLE.MEMBER) {
							throw new Error(
								"Invitations can only be sent for the member role.",
							);
						}
					},
					beforeAcceptInvitation: async (data) => {
						const existingMembership = await findMemberByUserId(data.user.id);
						if (existingMembership) {
							throw new Error(
								"This account already belongs to an organization. Sign up with a different account to accept this invitation.",
							);
						}
					},
				},
			}),
		],
	});
}

export const auth = createAuth();
