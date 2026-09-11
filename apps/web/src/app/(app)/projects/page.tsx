import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/console/page-header";
import { authClient } from "@/lib/auth-client";

import ProjectsPageClient from "./projects-page-client";

export const metadata: Metadata = {
	title: "Projects & rules",
};

export default async function ProjectsPage() {
	const session = await authClient.getSession({
		fetchOptions: { headers: await headers(), throw: true },
	});

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<div className="mx-auto max-w-4xl px-4 py-8">
			<PageHeader
				title="Projects & rules"
				description="Projects group your time for billing. Rules label it for you, before AI is ever involved."
			/>
			<ProjectsPageClient />
		</div>
	);
}
