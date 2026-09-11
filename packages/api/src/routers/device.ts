import { DEVICE_PLATFORM_VALUES } from "@flowlog/db/constants";
import {
	insertDevice,
	listDevicesByUser,
	revokeDeviceForUser,
} from "@flowlog/db/queries/device";
import {
	approvePairingRequest,
	findPendingPairingRequest,
} from "@flowlog/db/queries/device-pairing";
import {
	DeviceNotFoundError,
	issueDeviceToken,
	PairingRequestNotFoundError,
} from "@flowlog/utils";
import { z } from "zod";

import { protectedProcedure } from "../index";
import { throwAsOrpcError } from "../to-orpc-error";

const createDeviceSchema = z.object({
	name: z.string().trim().min(1).max(80),
	platform: z.enum(DEVICE_PLATFORM_VALUES),
});

const approvePairingSchema = z.object({
	pairingId: z.uuid(),
	name: z.string().trim().min(1).max(80).optional(),
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

export const approveDevicePairing = protectedProcedure
	.input(approvePairingSchema)
	.handler(async ({ input, context }) => {
		const approved = await approvePairingRequest(
			input.pairingId,
			context.session.user.id,
			input.name?.trim() || "My computer",
		);
		if (approved === null)
			throwAsOrpcError(new PairingRequestNotFoundError(input.pairingId));
		return approved;
	});

export const getDevicePairing = protectedProcedure
	.input(z.object({ pairingId: z.uuid() }))
	.handler(async ({ input }) => {
		const request = await findPendingPairingRequest(input.pairingId);
		if (request === null)
			throwAsOrpcError(new PairingRequestNotFoundError(input.pairingId));
		return request;
	});

export const deviceRouter = {
	list: listDevices,
	create: createDevice,
	revoke: revokeDevice,
	pairing: {
		get: getDevicePairing,
		approve: approveDevicePairing,
	},
};
