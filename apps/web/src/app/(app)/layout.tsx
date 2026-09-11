import { SidebarInset, SidebarProvider } from "@flowlog/ui/components/sidebar";
import type { Metadata } from "next";
import { cookies } from "next/headers";

import { AppSidebar } from "@/components/console/app-sidebar";
import { ConsoleTopbar } from "@/components/console/console-topbar";

export const metadata: Metadata = {
	robots: { index: false, follow: false },
};

export default async function AppLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const sidebarState = (await cookies()).get("sidebar_state")?.value;

	return (
		<SidebarProvider defaultOpen={sidebarState !== "false"}>
			<a
				href="#console-main"
				className="fixed -top-20 left-2 z-50 rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground text-sm transition-[top] duration-150 ease-fluid focus:top-2"
			>
				Skip to content
			</a>
			<AppSidebar />
			<SidebarInset className="flex min-h-svh min-w-0 flex-col">
				<ConsoleTopbar />
				<div
					id="console-main"
					tabIndex={-1}
					className="min-h-0 flex-1 outline-none"
				>
					{children}
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
