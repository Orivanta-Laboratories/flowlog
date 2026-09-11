"use client";

import { Separator } from "@flowlog/ui/components/separator";
import { SidebarTrigger } from "@flowlog/ui/components/sidebar";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
	"/dashboard": "Review",
	"/projects": "Projects & rules",
	"/team": "Team",
	"/devices": "Devices",
	"/devices/connect": "Connect a device",
	"/settings": "Settings",
	"/ai": "Assistant",
};

export function ConsoleTopbar() {
	const pathname = usePathname();
	const title = PAGE_TITLES[pathname] ?? "Console";

	return (
		<header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80">
			<SidebarTrigger />
			<Separator orientation="vertical" className="mx-1 h-4" />
			<span className="cn-font-heading truncate font-medium text-sm">
				{title}
			</span>
		</header>
	);
}
