import { LOCALE_VALUES } from "@flowlog/db/constants";
import {
	findUserPreferences,
	updateUserPreferences,
} from "@flowlog/db/queries/user";
import { z } from "zod";

import { protectedProcedure } from "../index";

const updateAccountSchema = z.object({
	locale: z.enum(LOCALE_VALUES).optional(),
	aiLabelingEnabled: z.boolean().optional(),
	excludedAppNames: z
		.array(z.string().trim().min(1).max(120))
		.max(200)
		.optional(),
	excludedTitlePatterns: z
		.array(z.string().trim().min(1).max(200))
		.max(200)
		.optional(),
	excludedDomains: z
		.array(z.string().trim().min(1).max(253))
		.max(200)
		.optional(),
});

export const getAccount = protectedProcedure.handler(async ({ context }) => {
	return findUserPreferences(context.session.user.id);
});

export const updateAccount = protectedProcedure
	.input(updateAccountSchema)
	.handler(async ({ input, context }) => {
		return updateUserPreferences(context.session.user.id, input);
	});

export const accountRouter = {
	get: getAccount,
	update: updateAccount,
};
