import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";

export function useAccount() {
	return useQuery(orpc.account.get.queryOptions());
}

export function useUpdateAccount() {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.account.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: orpc.account.get.key() });
			},
		}),
	);
}
