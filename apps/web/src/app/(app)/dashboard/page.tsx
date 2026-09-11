import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AiConsent } from "@/components/ai-consent";
import { PageHeader } from "@/components/console/page-header";
import { authClient } from "@/lib/auth-client";

import Dashboard from "./dashboard";

export const metadata: Metadata = {
	title: "Review",
};

export default async function DashboardPage() {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
			throw: true,
		},
	});

	if (!session?.user) {
		redirect("/login");
	}

	const firstName = session.user.name.split(" ")[0] ?? session.user.name;

	return (
		<div className="mx-auto max-w-5xl px-4 py-8">
			<PageHeader
				title={`Your day, ${firstName}`}
				description="Read the draft Flowlog put together, fix what's wrong, and confirm the blocks you're happy with."
			/>
			<AiConsent />
			<Dashboard session={session} />
		</div>
	);
}
