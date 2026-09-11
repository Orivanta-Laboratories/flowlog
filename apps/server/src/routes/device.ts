import {
	DEVICE_PLATFORM_VALUES,
	EVENT_SOURCE_VALUES,
	PAIRING_REQUEST_STATUS,
} from "@flowlog/db/constants";
import {
	findActiveDeviceByTokenHash,
	touchDeviceLastSeen,
} from "@flowlog/db/queries/device";
import {
	findPairingRequestStatus,
	insertPairingRequest,
} from "@flowlog/db/queries/device-pairing";
import { insertRawEvents } from "@flowlog/db/queries/raw-event";
import { findUserExclusions } from "@flowlog/db/queries/user";
import {
	hashDeviceToken,
	isExcludedActivity,
	issueDeviceToken,
	isWithinWorkSchedule,
} from "@flowlog/utils";
import { Hono } from "hono";
import { z } from "zod";
import { deviceLimits } from "./device-limits";

const PAIRING_REQUEST_TTL_MS = 5 * 60 * 1000;

const startPairingSchema = z.object({
	platform: z.enum(DEVICE_PLATFORM_VALUES),
});

const rawEventSchema = z.object({
	clientEventId: z.string().min(1).max(100),
	occurredAt: z.coerce.date(),
	source: z.enum(EVENT_SOURCE_VALUES),
	appName: z.string().max(200).nullable().default(null),
	windowTitle: z.string().max(500).nullable().default(null),
	repoName: z.string().max(200).nullable().default(null),
	branchName: z.string().max(200).nullable().default(null),
	commitSubject: z.string().max(500).nullable().default(null),
	isIdle: z.boolean().default(false),
});

const pushEventsSchema = z.object({
	events: z.array(rawEventSchema).min(1).max(1000),
});

export const deviceRoutes = new Hono();
deviceRoutes.route("/", deviceLimits());

deviceRoutes.use("/v1/pairing*", async (c, next) => {
	c.header("Cache-Control", "no-store");
	c.header("Referrer-Policy", "no-referrer");
	await next();
});

async function authenticateDevice(authorizationHeader: string | undefined) {
	const token = authorizationHeader?.startsWith("Bearer ")
		? authorizationHeader.slice(7)
		: null;
	if (token === null) {
		return null;
	}
	return findActiveDeviceByTokenHash(hashDeviceToken(token));
}

deviceRoutes.get("/v1/config", async (c) => {
	const device = await authenticateDevice(c.req.header("authorization"));
	if (device === null) {
		return c.json({ error: "UNAUTHORIZED" }, 401);
	}

	const exclusions = await findUserExclusions(device.userId);
	return c.json({
		excludedAppNames: exclusions?.excludedAppNames ?? [],
		excludedTitlePatterns: exclusions?.excludedTitlePatterns ?? [],
		excludedDomains: exclusions?.excludedDomains ?? [],
		workSchedule: exclusions?.workSchedule ?? null,
	});
});

deviceRoutes.post("/v1/events", async (c) => {
	const device = await authenticateDevice(c.req.header("authorization"));
	if (device === null) {
		return c.json({ error: "UNAUTHORIZED" }, 401);
	}

	const parsed = pushEventsSchema.safeParse(
		await c.req.json().catch(() => null),
	);
	if (!parsed.success) {
		return c.json({ error: "INVALID_PAYLOAD" }, 400);
	}

	const exclusions = await findUserExclusions(device.userId);
	const acceptable = parsed.data.events.filter(
		(event) =>
			exclusions === null ||
			(isWithinWorkSchedule(event.occurredAt, exclusions.workSchedule) &&
				!isExcludedActivity(
					{ appName: event.appName, windowTitle: event.windowTitle },
					{
						appNames: exclusions.excludedAppNames,
						titlePatterns: exclusions.excludedTitlePatterns,
					},
				)),
	);

	await Promise.all([
		insertRawEvents(
			acceptable.map((event) => ({
				userId: device.userId,
				deviceId: device.id,
				...event,
			})),
		),
		touchDeviceLastSeen(device.id, new Date()),
	]);

	return c.json({
		accepted: acceptable.length,
		rejected: parsed.data.events.length - acceptable.length,
	});
});

deviceRoutes.post("/v1/pairing", async (c) => {
	const parsed = startPairingSchema.safeParse(
		await c.req.json().catch(() => null),
	);
	if (!parsed.success) {
		return c.json({ error: "INVALID_PAYLOAD" }, 400);
	}

	const expiresAt = new Date(Date.now() + PAIRING_REQUEST_TTL_MS);
	const issued = issueDeviceToken();
	const row = await insertPairingRequest(
		parsed.data.platform,
		expiresAt,
		issued.tokenHash,
		issued.tokenPreview,
	);
	if (row === undefined) {
		return c.json({ error: "PAIRING_REQUEST_FAILED" }, 500);
	}
	return c.json({
		pairingId: row.id,
		expiresAt: row.expiresAt,
		deviceCode: issued.token,
	});
});

deviceRoutes.get("/v1/pairing/:id", async (c) => {
	const id = z.uuid().safeParse(c.req.param("id"));
	if (!id.success) {
		return c.json({ status: "expired" });
	}

	const authorization = c.req.header("authorization");
	if (!authorization?.startsWith("Bearer "))
		return c.json({ error: "UNAUTHORIZED" }, 401);
	const current = await findPairingRequestStatus(
		id.data,
		hashDeviceToken(authorization.slice(7)),
	);
	if (current === null) return c.json({ status: "expired" });
	if (current.status === PAIRING_REQUEST_STATUS.APPROVED) {
		return current.deviceId === null
			? c.json({ status: "expired" })
			: c.json({ status: "approved", deviceId: current.deviceId });
	}
	return c.json({ status: "pending" });
});
