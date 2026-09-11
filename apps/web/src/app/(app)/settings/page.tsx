import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/console/page-header";
import { authClient } from "@/lib/auth-client";

import SettingsPageClient from "./settings-page-client";

export const metadata: Metadata = {
	title: "Settings",
};

export default async function SettingsPage() {
	const session = await authClient.getSession({
		fetchOptions: { headers: await headers(), throw: true },
	});

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<div className="mx-auto max-w-3xl px-4 py-8">
			<PageHeader
				title="Settings"
				description="When Flowlog collects, what it leaves alone, and whether a cloud model ever sees it."
			/>
			<SettingsPageClient />
		</div>
	);
}
