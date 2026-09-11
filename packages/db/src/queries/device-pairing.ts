import { and, eq, gt, isNull, sql } from "drizzle-orm";

import { type DevicePlatform, PAIRING_REQUEST_STATUS } from "../constants";
import { db } from "../index";
import { device, devicePairingRequest } from "../schema/tracking";

export async function insertPairingRequest(
	platform: DevicePlatform,
	expiresAt: Date,
	tokenHash: string,
	tokenPreview: string,
) {
	const [row] = await db
		.insert(devicePairingRequest)
		.values({
			platform,
			expiresAt,
			tokenHash,
			tokenPreview,
		})
		.returning({
			id: devicePairingRequest.id,
			expiresAt: devicePairingRequest.expiresAt,
		});
	return row;
}

export async function findPairingRequestStatus(id: string, tokenHash: string) {
	const [row] = await db
		.select({
			status: devicePairingRequest.status,
			expiresAt: devicePairingRequest.expiresAt,
			deviceId: device.id,
		})
		.from(devicePairingRequest)
		.leftJoin(
			device,
			and(eq(device.id, devicePairingRequest.id), isNull(device.revokedAt)),
		)
		.where(
			and(
				eq(devicePairingRequest.id, id),
				eq(devicePairingRequest.tokenHash, tokenHash),
				gt(devicePairingRequest.expiresAt, new Date()),
			),
		)
		.limit(1);
	return row ?? null;
}

export async function findPendingPairingRequest(id: string) {
	const [row] = await db
		.select({
			platform: devicePairingRequest.platform,
			expiresAt: devicePairingRequest.expiresAt,
		})
		.from(devicePairingRequest)
		.where(
			and(
				eq(devicePairingRequest.id, id),
				eq(devicePairingRequest.status, PAIRING_REQUEST_STATUS.PENDING),
				gt(devicePairingRequest.expiresAt, new Date()),
			),
		)
		.limit(1);
	return row ?? null;
}

export async function approvePairingRequest(
	id: string,
	userId: string,
	name: string,
) {
	const result = await db.execute<{
		deviceName: string;
		platform: DevicePlatform;
	}>(sql`
		WITH approved AS (
			UPDATE device_pairing_request
			SET status = ${PAIRING_REQUEST_STATUS.APPROVED}, user_id = ${userId}
			WHERE id = ${id} AND status = ${PAIRING_REQUEST_STATUS.PENDING}
			AND expires_at > now() AND token_hash IS NOT NULL AND token_preview IS NOT NULL
			RETURNING id, platform, token_hash, token_preview
		)
		INSERT INTO device (id, user_id, name, platform, token_hash, token_preview)
		SELECT id, ${userId}, ${name}, platform, token_hash, token_preview FROM approved
		RETURNING name AS "deviceName", platform
	`);
	return result.rows[0] ?? null;
}
