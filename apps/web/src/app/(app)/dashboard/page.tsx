import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import Dashboard from "./dashboard";

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

	return (
		<div className="mx-auto max-w-5xl px-4 py-8">
			<h1 className="mb-1 font-semibold text-xl">Dashboard</h1>
			<p className="mb-6 text-muted-foreground text-sm">
				Welcome, {session.user.name}.
			</p>
			<Dashboard session={session} />
		</div>
	);
}
