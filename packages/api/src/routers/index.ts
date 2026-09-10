import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { accountRouter } from "./account";
import { activitySessionRouter } from "./activitysession";
import { deviceRouter } from "./device";
import { exportRouter } from "./export";
import { matchingRuleRouter } from "./matchingrule";
import { organizationRouter } from "./organization";
import { projectRouter } from "./project";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	privateData: protectedProcedure.handler(({ context }) => {
		return {
			message: "This is private",
			user: context.session?.user,
		};
	}),
	account: accountRouter,
	activitysession: activitySessionRouter,
	device: deviceRouter,
	export: exportRouter,
	matchingrule: matchingRuleRouter,
	organization: organizationRouter,
	project: projectRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
