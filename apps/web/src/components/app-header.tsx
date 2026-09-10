"use client";

import { cn } from "@flowlog/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

const LINKS = [
	{ to: "/dashboard", label: "Dashboard" },
	{ to: "/projects", label: "Projects" },
	{ to: "/devices", label: "Devices" },
	{ to: "/settings", label: "Settings" },
	{ to: "/ai", label: "AI Chat" },
] as const;

export default function AppHeader() {
	const pathname = usePathname();

	return (
		<header className="border-border border-b">
			<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
				<Link href="/" className="font-semibold text-sm tracking-tight">
					Flowlog
				</Link>
				<nav aria-label="Main" className="flex items-center gap-1 text-sm">
					{LINKS.map(({ to, label }) => {
						const isActive = pathname === to || pathname.startsWith(`${to}/`);
						return (
							<Link
								key={to}
								href={to}
								aria-current={isActive ? "page" : undefined}
								className={cn(
									"px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
									isActive && "bg-muted text-foreground",
								)}
							>
								{label}
							</Link>
						);
					})}
				</nav>
				<div className="flex items-center gap-2">
					<ModeToggle />
					<UserMenu />
				</div>
			</div>
		</header>
	);
}
