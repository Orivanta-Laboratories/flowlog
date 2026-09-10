import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import DevicesPageClient from "./devices-page-client";

export default async function DevicesPage() {
	const session = await authClient.getSession({
		fetchOptions: { headers: await headers(), throw: true },
	});

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<div className="mx-auto max-w-2xl px-4 py-8">
			<h1 className="mb-1 font-semibold text-xl">Devices</h1>
			<p className="mb-6 text-muted-foreground text-sm">
				Pair the desktop agent or browser extension so it can send activity to
				your timesheet.
			</p>
			<DevicesPageClient />
		</div>
	);
}
