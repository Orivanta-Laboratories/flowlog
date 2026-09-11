import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/console/page-header";
import { authClient } from "@/lib/auth-client";

import TeamPageClient from "./team-page-client";

export const metadata: Metadata = {
	title: "Team",
};

export default async function TeamPage() {
	const session = await authClient.getSession({
		fetchOptions: { headers: await headers(), throw: true },
	});

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<div className="mx-auto max-w-4xl px-4 py-8">
			<PageHeader
				title="Team"
				description="Everyone in this organization, and how much time they've confirmed."
			/>
			<TeamPageClient />
		</div>
	);
}
