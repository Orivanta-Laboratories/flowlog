import { useQuery } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";

export function useOrganizationTrackedTime(days?: number) {
	return useQuery(
		orpc.organization.member.trackedtime.queryOptions({
			input: days === undefined ? {} : { days },
		}),
	);
}

export function useOrganizationHeatmap(days?: number) {
	return useQuery(
		orpc.organization.heatmap.get.queryOptions({
			input: days === undefined ? {} : { days },
		}),
	);
}
