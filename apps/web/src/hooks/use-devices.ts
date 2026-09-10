import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";

export function useDeviceList() {
	return useQuery(orpc.device.list.queryOptions());
}

export function useCreateDevice() {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.device.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: orpc.device.list.key() });
			},
		}),
	);
}

export function useRevokeDevice() {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.device.revoke.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: orpc.device.list.key() });
			},
		}),
	);
}
