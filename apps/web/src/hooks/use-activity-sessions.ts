import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";

export function useActivitySessions(
	date: string,
	timezoneOffsetMinutes: number,
) {
	return useQuery(
		orpc.activitysession.list.queryOptions({
			input: { date, timezoneOffsetMinutes },
		}),
	);
}

export function useConfirmActivitySessions() {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.activitysession.confirm.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.activitysession.list.key(),
				});
			},
		}),
	);
}

export function useMergeActivitySessions() {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.activitysession.merge.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.activitysession.list.key(),
				});
			},
		}),
	);
}

export function useSplitActivitySession() {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.activitysession.split.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.activitysession.list.key(),
				});
			},
		}),
	);
}

export function useRequestAiSuggestions() {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.activitysession.requestaisuggestions.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.activitysession.list.key(),
				});
			},
		}),
	);
}
