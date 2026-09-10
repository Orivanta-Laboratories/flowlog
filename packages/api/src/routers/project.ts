import { PROJECT_COLOR, PROJECT_COLOR_VALUES } from "@flowlog/db/constants";
import {
	archiveProjectForUser,
	findProjectByNameForUser,
	insertProject,
	listProjectsByUser,
	updateProjectForUser,
} from "@flowlog/db/queries/project";
import { ProjectNameTakenError, ProjectNotFoundError } from "@flowlog/utils";
import { z } from "zod";

import { protectedProcedure } from "../index";
import { throwAsOrpcError } from "../to-orpc-error";

const projectColorSchema = z.enum(PROJECT_COLOR_VALUES);

const createProjectSchema = z.object({
	name: z.string().trim().min(1).max(100),
	clientName: z.string().trim().min(1).max(100).nullable().default(null),
	color: projectColorSchema.default(PROJECT_COLOR.CHART_1),
	billingRateCents: z.number().int().min(0).nullable().default(null),
});

const updateProjectSchema = z.object({
	id: z.uuid(),
	name: z.string().trim().min(1).max(100).optional(),
	clientName: z.string().trim().min(1).max(100).nullable().optional(),
	color: projectColorSchema.optional(),
	billingRateCents: z.number().int().min(0).nullable().optional(),
});

async function assertNameAvailable(userId: string, name: string) {
	const existing = await findProjectByNameForUser(userId, name);
	if (existing !== null) {
		throwAsOrpcError(new ProjectNameTakenError(name));
	}
}

export const listProjects = protectedProcedure.handler(async ({ context }) => {
	return listProjectsByUser(context.session.user.id);
});

export const createProject = protectedProcedure
	.input(createProjectSchema)
	.handler(async ({ input, context }) => {
		await assertNameAvailable(context.session.user.id, input.name);
		return insertProject({
			userId: context.session.user.id,
			name: input.name,
			clientName: input.clientName,
			color: input.color,
			billingRateCents: input.billingRateCents,
		});
	});

export const updateProject = protectedProcedure
	.input(updateProjectSchema)
	.handler(async ({ input, context }) => {
		if (input.name !== undefined) {
			await assertNameAvailable(context.session.user.id, input.name);
		}
		const { id, ...values } = input;
		const row = await updateProjectForUser(context.session.user.id, id, values);
		if (row === null) {
			throwAsOrpcError(new ProjectNotFoundError(id));
		}
		return row;
	});

export const archiveProject = protectedProcedure
	.input(z.object({ id: z.uuid() }))
	.handler(async ({ input, context }) => {
		const row = await archiveProjectForUser(
			context.session.user.id,
			input.id,
			new Date(),
		);
		if (row === null) {
			throwAsOrpcError(new ProjectNotFoundError(input.id));
		}
		return row;
	});

export const projectRouter = {
	list: listProjects,
	create: createProject,
	update: updateProject,
	archive: archiveProject,
};
