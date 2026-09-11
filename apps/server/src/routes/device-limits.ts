import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";

export function deviceLimits() {
	const limits = new Hono();
	let resetAt = 0;
	let starts = 0;
	limits.use("*", bodyLimit({ maxSize: 2 * 1024 * 1024 }));
	limits.use("/v1/pairing", async (c, next) => {
		const now = Date.now();
		if (now >= resetAt) {
			starts = 0;
			resetAt = now + 60_000;
		}
		starts += 1;
		if (starts > 60) {
			c.header("Retry-After", String(Math.ceil((resetAt - now) / 1000)));
			return c.json({ error: "TOO_MANY_REQUESTS" }, 429);
		}
		await next();
	});
	return limits;
}
