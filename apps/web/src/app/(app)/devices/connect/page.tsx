import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/console/page-header";
import { authClient } from "@/lib/auth-client";

import DeviceConnectPageClient from "./connect-page-client";

export const metadata: Metadata = {
	title: "Connect a device",
};

export default async function DeviceConnectPage({
	searchParams,
}: {
	searchParams: Promise<{ pairingId?: string }>;
}) {
	const [session, { pairingId }] = await Promise.all([
		authClient.getSession({
			fetchOptions: { headers: await headers(), throw: true },
		}),
		searchParams,
	]);

	if (!session?.user) {
		redirect(
			`/login?next=${encodeURIComponent(`/devices/connect?pairingId=${pairingId ?? ""}`)}`,
		);
	}

	return (
		<div className="mx-auto max-w-lg px-4 py-8">
			<PageHeader title="Connect a device" />
			{pairingId ? (
				<DeviceConnectPageClient pairingId={pairingId} />
			) : (
				<p role="alert" className="text-destructive text-sm">
					This link is missing its pairing code. Go back to the device and start
					connecting again.
				</p>
			)}
		</div>
	);
}
