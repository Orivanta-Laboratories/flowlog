import { ORG_ROLE } from "@flowlog/db/constants";
import {
	dailyTrackedSecondsForOrganization,
	findMemberByUserId,
	listMembersWithTrackedSeconds,
} from "@flowlog/db/queries/organization";
import {
	OrganizationNotFoundError,
	OrganizationOwnerOnlyError,
} from "@flowlog/utils";
import { z } from "zod";

import { protectedProcedure } from "../index";
import { throwAsOrpcError } from "../to-orpc-error";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

async function requireOwnerMembership(userId: string) {
	const membership = await findMemberByUserId(userId);
	if (membership === null) {
		throw new OrganizationNotFoundError();
	}
	if (membership.role !== ORG_ROLE.OWNER) {
		throw new OrganizationOwnerOnlyError();
	}
	return membership;
}

function daysAgo(days: number) {
	return new Date(Date.now() - days * MILLISECONDS_PER_DAY);
}

const rangeSchema = z.object({
	days: z.number().int().min(1).max(365),
});

const listMembersTrackedTime = protectedProcedure
	.input(rangeSchema.extend({ days: rangeSchema.shape.days.default(7) }))
	.handler(async ({ input, context }) => {
		try {
			const membership = await requireOwnerMembership(context.session.user.id);
			return await listMembersWithTrackedSeconds(
				membership.organizationId,
				daysAgo(input.days),
				new Date(),
			);
		} catch (error) {
			throwAsOrpcError(error);
		}
	});

const getHeatmap = protectedProcedure
	.input(rangeSchema.extend({ days: rangeSchema.shape.days.default(90) }))
	.handler(async ({ input, context }) => {
		try {
			const membership = await requireOwnerMembership(context.session.user.id);
			return await dailyTrackedSecondsForOrganization(
				membership.organizationId,
				daysAgo(input.days),
				new Date(),
			);
		} catch (error) {
			throwAsOrpcError(error);
		}
	});

export const organizationRouter = {
	member: {
		trackedtime: listMembersTrackedTime,
	},
	heatmap: {
		get: getHeatmap,
	},
};
