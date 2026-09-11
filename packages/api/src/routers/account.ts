import { LOCALE_VALUES } from "@flowlog/db/constants";
import {
	findUserPreferences,
	updateUserPreferences,
} from "@flowlog/db/queries/user";
import { z } from "zod";

import { protectedProcedure } from "../index";

const scheduleSchema = z
	.object({
		enabled: z.boolean(),
		timezone: z
			.string()
			.max(100)
			.refine((value) => {
				try {
					new Intl.DateTimeFormat("en", { timeZone: value });
					return true;
				} catch {
					return false;
				}
			}, "Choose a valid timezone"),
		days: z.array(z.number().int().min(0).max(6)).min(1).max(7),
		startMinute: z.number().int().min(0).max(1439),
		endMinute: z.number().int().min(0).max(1439),
	})
	.refine(
		(value) => value.startMinute !== value.endMinute,
		"Shift start and end must differ",
	);

const updateAccountSchema = z.object({
	workSchedule: scheduleSchema.nullable().optional(),
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
		return updateUserPreferences(context.session.user.id, {
			...input,
			...(input.aiLabelingEnabled !== undefined
				? { aiConsentAt: new Date() }
				: {}),
		});
	});

export const accountRouter = {
	get: getAccount,
	update: updateAccount,
};
