import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import ProjectsPageClient from "./projects-page-client";

export default async function ProjectsPage() {
	const session = await authClient.getSession({
		fetchOptions: { headers: await headers(), throw: true },
	});

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<div className="mx-auto max-w-3xl px-4 py-8">
			<h1 className="mb-1 font-semibold text-xl">Projects & rules</h1>
			<p className="mb-6 text-muted-foreground text-sm">
				Projects group your time for billing. Rules auto-label sessions before
				AI is ever involved.
			</p>
			<ProjectsPageClient />
		</div>
	);
}
