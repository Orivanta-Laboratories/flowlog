import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "../index";
import { device } from "../schema/tracking";

export async function listDevicesByUser(userId: string) {
	return db
		.select({
			id: device.id,
			name: device.name,
			platform: device.platform,
			tokenPreview: device.tokenPreview,
			lastSeenAt: device.lastSeenAt,
			revokedAt: device.revokedAt,
			createdAt: device.createdAt,
		})
		.from(device)
		.where(eq(device.userId, userId))
		.orderBy(desc(device.createdAt));
}

export async function insertDevice(values: typeof device.$inferInsert) {
	const [row] = await db
		.insert(device)
		.values(values)
		.returning({ id: device.id, name: device.name });
	return row;
}

export async function findActiveDeviceByTokenHash(tokenHash: string) {
	const [row] = await db
		.select({ id: device.id, userId: device.userId, name: device.name })
		.from(device)
		.where(and(eq(device.tokenHash, tokenHash), isNull(device.revokedAt)))
		.limit(1);
	return row ?? null;
}

export async function touchDeviceLastSeen(deviceId: string, seenAt: Date) {
	await db
		.update(device)
		.set({ lastSeenAt: seenAt })
		.where(eq(device.id, deviceId));
}

export async function revokeDeviceForUser(
	userId: string,
	deviceId: string,
	revokedAt: Date,
) {
	const [row] = await db
		.update(device)
		.set({ revokedAt })
		.where(
			and(
				eq(device.id, deviceId),
				eq(device.userId, userId),
				isNull(device.revokedAt),
			),
		)
		.returning({ id: device.id });
	return row ?? null;
}
