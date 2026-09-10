"use client";

import { Button } from "@flowlog/ui/components/button";
import { Skeleton } from "@flowlog/ui/components/skeleton";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";

import { ModeToggle } from "./mode-toggle";

const NAV_LINKS = [
	{ href: "#product", label: "Product" },
	{ href: "#how-it-works", label: "How it works" },
	{ href: "#faq", label: "FAQ" },
] as const;

export default function MarketingHeader() {
	const { data: session, isPending } = authClient.useSession();

	return (
		<header className="border-border border-b bg-background">
			<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
				<Link href="/" className="font-semibold text-lg tracking-tight">
					Flowlog
				</Link>

				<nav
					aria-label="Main"
					className="hidden items-center gap-6 text-muted-foreground text-sm md:flex"
				>
					{NAV_LINKS.map((link) => (
						<a
							key={link.href}
							href={link.href}
							className="transition-colors hover:text-foreground"
						>
							{link.label}
						</a>
					))}
				</nav>

				<div className="flex items-center gap-3">
					<ModeToggle />
					{isPending ? (
						<Skeleton className="h-9 w-28 rounded-full" />
					) : session ? (
						<Button
							render={<Link href="/dashboard" />}
							className="rounded-full"
							size="sm"
						>
							Open dashboard
						</Button>
					) : (
						<>
							<Button
								render={<Link href="/login" />}
								variant="ghost"
								size="sm"
								className="hidden rounded-full sm:inline-flex"
							>
								Sign in
							</Button>
							<Button
								render={<Link href="/login" />}
								className="rounded-full"
								size="sm"
							>
								Get started
							</Button>
						</>
					)}
				</div>
			</div>
		</header>
	);
}
