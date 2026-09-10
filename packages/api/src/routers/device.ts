import { DEVICE_PLATFORM_VALUES } from "@flowlog/db/constants";
import {
	insertDevice,
	listDevicesByUser,
	revokeDeviceForUser,
} from "@flowlog/db/queries/device";
import { DeviceNotFoundError, issueDeviceToken } from "@flowlog/utils";
import { z } from "zod";

import { protectedProcedure } from "../index";
import { throwAsOrpcError } from "../to-orpc-error";

const createDeviceSchema = z.object({
	name: z.string().trim().min(1).max(80),
	platform: z.enum(DEVICE_PLATFORM_VALUES),
});

export const listDevices = protectedProcedure.handler(async ({ context }) => {
	return listDevicesByUser(context.session.user.id);
});

export const createDevice = protectedProcedure
	.input(createDeviceSchema)
	.handler(async ({ input, context }) => {
		const issued = issueDeviceToken();
		const row = await insertDevice({
			userId: context.session.user.id,
			name: input.name,
			platform: input.platform,
			tokenHash: issued.tokenHash,
			tokenPreview: issued.tokenPreview,
		});
		return { id: row?.id, name: row?.name, token: issued.token };
	});

export const revokeDevice = protectedProcedure
	.input(z.object({ id: z.uuid() }))
	.handler(async ({ input, context }) => {
		const row = await revokeDeviceForUser(
			context.session.user.id,
			input.id,
			new Date(),
		);
		if (row === null) {
			throwAsOrpcError(new DeviceNotFoundError(input.id));
		}
		return row;
	});

export const deviceRouter = {
	list: listDevices,
	create: createDevice,
	revoke: revokeDevice,
};
