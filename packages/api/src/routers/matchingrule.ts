import {
	RULE_FIELD_VALUES,
	RULE_OPERATOR,
	RULE_OPERATOR_VALUES,
} from "@flowlog/db/constants";
import {
	archiveMatchingRuleForUser,
	insertMatchingRule,
	listMatchingRulesByUser,
} from "@flowlog/db/queries/matching-rule";
import { findProjectByUser } from "@flowlog/db/queries/project";
import {
	MatchingRuleNotFoundError,
	ProjectNotFoundError,
} from "@flowlog/utils";
import { z } from "zod";

import { protectedProcedure } from "../index";
import { throwAsOrpcError } from "../to-orpc-error";

const createMatchingRuleSchema = z.object({
	projectId: z.uuid(),
	field: z.enum(RULE_FIELD_VALUES),
	operator: z.enum(RULE_OPERATOR_VALUES).default(RULE_OPERATOR.CONTAINS),
	value: z.string().trim().min(1).max(200),
	label: z.string().trim().min(1).max(120).nullable().default(null),
	priority: z.number().int().min(0).max(100).default(0),
});

export const listMatchingRules = protectedProcedure.handler(
	async ({ context }) => {
		return listMatchingRulesByUser(context.session.user.id);
	},
);

export const createMatchingRule = protectedProcedure
	.input(createMatchingRuleSchema)
	.handler(async ({ input, context }) => {
		const project = await findProjectByUser(
			context.session.user.id,
			input.projectId,
		);
		if (project === null) {
			throwAsOrpcError(new ProjectNotFoundError(input.projectId));
		}
		return insertMatchingRule({
			userId: context.session.user.id,
			projectId: input.projectId,
			field: input.field,
			operator: input.operator,
			value: input.value,
			label: input.label,
			priority: input.priority,
		});
	});

export const archiveMatchingRule = protectedProcedure
	.input(z.object({ id: z.uuid() }))
	.handler(async ({ input, context }) => {
		const row = await archiveMatchingRuleForUser(
			context.session.user.id,
			input.id,
			new Date(),
		);
		if (row === null) {
			throwAsOrpcError(new MatchingRuleNotFoundError(input.id));
		}
		return row;
	});

export const matchingRuleRouter = {
	list: listMatchingRules,
	create: createMatchingRule,
	archive: archiveMatchingRule,
};
