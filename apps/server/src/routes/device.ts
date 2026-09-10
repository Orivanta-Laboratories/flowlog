import { EVENT_SOURCE_VALUES } from "@flowlog/db/constants";
import {
	findActiveDeviceByTokenHash,
	touchDeviceLastSeen,
} from "@flowlog/db/queries/device";
import { insertRawEvents } from "@flowlog/db/queries/raw-event";
import { findUserExclusions } from "@flowlog/db/queries/user";
import { hashDeviceToken, isExcludedActivity } from "@flowlog/utils";
import { Hono } from "hono";
import { z } from "zod";

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
			!isExcludedActivity(
				{ appName: event.appName, windowTitle: event.windowTitle },
				{
					appNames: exclusions.excludedAppNames,
					titlePatterns: exclusions.excludedTitlePatterns,
				},
			),
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
