import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import SettingsPageClient from "./settings-page-client";

export default async function SettingsPage() {
	const session = await authClient.getSession({
		fetchOptions: { headers: await headers(), throw: true },
	});

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<div className="mx-auto max-w-2xl px-4 py-8">
			<h1 className="mb-1 font-semibold text-xl">Settings</h1>
			<p className="mb-6 text-muted-foreground text-sm">
				Control what gets tracked and whether AI ever sees your activity.
			</p>
			<SettingsPageClient />
		</div>
	);
}
