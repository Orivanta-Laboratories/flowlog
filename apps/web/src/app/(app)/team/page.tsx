import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import TeamPageClient from "./team-page-client";

export default async function TeamPage() {
	const session = await authClient.getSession({
		fetchOptions: { headers: await headers(), throw: true },
	});

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<div className="mx-auto max-w-4xl px-4 py-8">
			<h1 className="mb-1 font-semibold text-xl">Team</h1>
			<p className="mb-6 text-muted-foreground text-sm">
				See who's on your organization and how their tracked time adds up.
			</p>
			<TeamPageClient />
		</div>
	);
}
