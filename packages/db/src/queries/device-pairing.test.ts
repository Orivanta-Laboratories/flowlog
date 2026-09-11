import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { type TestContext, test } from "node:test";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

dotenv.config({
	path: fileURLToPath(new URL("../../../../apps/server/.env", import.meta.url)),
});

const { eq } = await import("drizzle-orm");
const { db } = await import("../index");
const { DEVICE_PLATFORM, PAIRING_REQUEST_STATUS } = await import(
	"../constants"
);
const { user } = await import("../schema/auth");
const { device, devicePairingRequest } = await import("../schema/tracking");
const {
	insertPairingRequest,
	findPairingRequestStatus,
	findPendingPairingRequest,
	approvePairingRequest,
} = await import("./device-pairing");
const { findActiveDeviceByTokenHash, revokeDeviceForUser } = await import(
	"./device"
);

async function pairingFixture(
	t: TestContext,
	expiresAt = new Date(Date.now() + 600_000),
) {
	const userId = randomUUID();
	const tokenHash = createHash("sha256").update(randomUUID()).digest("hex");
	let requestId: string | undefined;
	t.after(async () => {
		if (requestId) {
			await db
				.delete(devicePairingRequest)
				.where(eq(devicePairingRequest.id, requestId));
		}
		await db.delete(device).where(eq(device.userId, userId));
		await db.delete(user).where(eq(user.id, userId));
	});
	await db.insert(user).values({
		id: userId,
		name: "Pairing integration test",
		email: `${userId}@flowlog-pairing-test.invalid`,
	});
	const request = await insertPairingRequest(
		DEVICE_PLATFORM.LINUX,
		expiresAt,
		tokenHash,
		"test-only",
	);
	assert.ok(request);
	requestId = request.id;
	return { userId, tokenHash, requestId };
}

test("pairing start stores the supplied hash and rejects polling with another hash", async (t) => {
	const { requestId, tokenHash } = await pairingFixture(t);
	const [stored] = await db
		.select()
		.from(devicePairingRequest)
		.where(eq(devicePairingRequest.id, requestId));
	assert.ok(stored);
	assert.ok(
		stored.tokenHash === tokenHash,
		"stored hash must match the request credential hash",
	);
	assert.equal(stored.status, PAIRING_REQUEST_STATUS.PENDING);
	assert.equal(
		await findPairingRequestStatus(requestId, "incorrect-hash"),
		null,
	);
	assert.ok(await findPendingPairingRequest(requestId));
	const pending = await findPairingRequestStatus(requestId, tokenHash);
	assert.equal(pending?.status, PAIRING_REQUEST_STATUS.PENDING);
	assert.equal(pending?.deviceId, null);
});

test("approval activates only the approved device using the original credential hash", async (t) => {
	const { requestId, tokenHash, userId } = await pairingFixture(t);
	const approved = await approvePairingRequest(
		requestId,
		userId,
		"Office laptop",
	);
	assert.deepEqual(approved, {
		deviceName: "Office laptop",
		platform: DEVICE_PLATFORM.LINUX,
	});
	assert.equal(await findPendingPairingRequest(requestId), null);
	const status = await findPairingRequestStatus(requestId, tokenHash);
	assert.equal(status?.status, PAIRING_REQUEST_STATUS.APPROVED);
	assert.equal(status?.deviceId, requestId);
	assert.deepEqual(await findActiveDeviceByTokenHash(tokenHash), {
		id: requestId,
		userId,
		name: "Office laptop",
	});
	assert.equal(
		await findPairingRequestStatus(requestId, "incorrect-hash"),
		null,
	);
});

test("concurrent approvals produce exactly one successful approval and one device", async (t) => {
	const { requestId, tokenHash, userId } = await pairingFixture(t);
	const results = await Promise.all([
		approvePairingRequest(requestId, userId, "First approval"),
		approvePairingRequest(requestId, userId, "Second approval"),
	]);
	assert.equal(results.filter((result) => result !== null).length, 1);
	assert.equal(results.filter((result) => result === null).length, 1);
	const rows = await db
		.select({ id: device.id, name: device.name })
		.from(device)
		.where(eq(device.userId, userId));
	assert.equal(rows.length, 1);
	assert.equal(
		rows[0]?.name,
		results.find((result) => result !== null)?.deviceName,
	);
	assert.equal((await findActiveDeviceByTokenHash(tokenHash))?.id, requestId);
});

test("expired pairing cannot be inspected, polled, or approved and creates no device", async (t) => {
	const { requestId, tokenHash, userId } = await pairingFixture(
		t,
		new Date(Date.now() - 60_000),
	);
	assert.equal(await findPendingPairingRequest(requestId), null);
	assert.equal(await findPairingRequestStatus(requestId, tokenHash), null);
	assert.equal(
		await approvePairingRequest(requestId, userId, "Expired request"),
		null,
	);
	assert.equal(await findActiveDeviceByTokenHash(tokenHash), null);
});

test("revocation removes the active device from pairing status and invalidates its credential", async (t) => {
	const { requestId, tokenHash, userId } = await pairingFixture(t);
	assert.ok(await approvePairingRequest(requestId, userId, "Revoked laptop"));
	assert.ok(await revokeDeviceForUser(userId, requestId, new Date()));
	assert.equal(
		(await findPairingRequestStatus(requestId, tokenHash))?.deviceId,
		null,
	);
	assert.equal(await findActiveDeviceByTokenHash(tokenHash), null);
	assert.equal(
		await approvePairingRequest(requestId, userId, "Replay approval"),
		null,
	);
});
