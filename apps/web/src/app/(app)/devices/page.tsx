import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/console/page-header";
import { authClient } from "@/lib/auth-client";

import DevicesPageClient from "./devices-page-client";

export const metadata: Metadata = {
	title: "Devices",
};

export default async function DevicesPage() {
	const session = await authClient.getSession({
		fetchOptions: { headers: await headers(), throw: true },
	});

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<div className="mx-auto max-w-3xl px-4 py-8">
			<PageHeader
				title="Devices"
				description="Each connected device sends activity to your timesheet. Revoke one and it stops immediately."
			/>
			<DevicesPageClient />
		</div>
	);
}
