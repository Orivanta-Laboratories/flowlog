import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";

export function useProjectList() {
	return useQuery(orpc.project.list.queryOptions());
}

export function useCreateProject() {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.project.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: orpc.project.list.key() });
			},
		}),
	);
}

export function useArchiveProject() {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.project.archive.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: orpc.project.list.key() });
			},
		}),
	);
}

export function useMatchingRuleList() {
	return useQuery(orpc.matchingrule.list.queryOptions());
}

export function useCreateMatchingRule() {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.matchingrule.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.matchingrule.list.key(),
				});
			},
		}),
	);
}

export function useArchiveMatchingRule() {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.matchingrule.archive.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.matchingrule.list.key(),
				});
			},
		}),
	);
}
