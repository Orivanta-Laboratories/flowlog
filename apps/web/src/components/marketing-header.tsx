"use client";

import { Button } from "@flowlog/ui/components/button";
import { Skeleton } from "@flowlog/ui/components/skeleton";
import { cn } from "@flowlog/ui/lib/utils";
import Link from "next/link";
import * as React from "react";

import { authClient } from "@/lib/auth-client";

import { ModeToggle } from "./mode-toggle";

const NAV_LINKS = [
	{ href: "#how-it-works", label: "How it works" },
	{ href: "#what-it-sees", label: "What it sees" },
	{ href: "#faq", label: "FAQ" },
] as const;

export default function MarketingHeader() {
	const { data: session, isPending } = authClient.useSession();
	const [mounted, setMounted] = React.useState(false);
	const [menuOpen, setMenuOpen] = React.useState(false);

	React.useEffect(() => {
		setMounted(true);
	}, []);

	return (
		<header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/75">
			<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
				<Link
					href="/"
					className="flex items-center gap-2 rounded-md font-semibold text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<span
						aria-hidden="true"
						className="flex size-6 items-center justify-center rounded-md bg-primary font-semibold text-[11px] text-primary-foreground"
					>
						FL
					</span>
					Flowlog
				</Link>

				<nav
					aria-label="Sections"
					className="hidden items-center gap-8 text-muted-foreground text-sm md:flex"
				>
					{NAV_LINKS.map((link) => (
						<a
							key={link.href}
							href={link.href}
							className="transition-colors duration-700 ease-fluid hover:text-foreground"
						>
							{link.label}
						</a>
					))}
				</nav>

				<div className="flex items-center gap-2">
					<ModeToggle className="rounded-full" />
					<div className="hidden items-center gap-2 md:flex">
						{!mounted || isPending ? (
							<Skeleton className="h-8 w-28 rounded-full" />
						) : session ? (
							<Button
								render={<Link href="/dashboard" />}
								nativeButton={false}
								className="rounded-full text-sm"
								size="sm"
							>
								Open your console
							</Button>
						) : (
							<>
								<Button
									render={<Link href="/login" />}
									nativeButton={false}
									variant="ghost"
									size="sm"
									className="rounded-full text-sm"
								>
									Sign in
								</Button>
								<Button
									render={<Link href="/login" />}
									nativeButton={false}
									className="rounded-full text-sm"
									size="sm"
								>
									Create your account
								</Button>
							</>
						)}
					</div>
					<Button
						variant="ghost"
						size="icon-sm"
						className="rounded-full md:hidden"
						aria-expanded={menuOpen}
						aria-controls="marketing-mobile-nav"
						aria-label={menuOpen ? "Close sections menu" : "Open sections menu"}
						onClick={() => setMenuOpen((open) => !open)}
					>
						<span aria-hidden="true" className="relative block h-3 w-4">
							<span
								className={cn(
									"absolute left-0 block h-px w-4 bg-current transition-all duration-700 ease-fluid",
									menuOpen ? "top-1.5 rotate-45" : "top-0",
								)}
							/>
							<span
								className={cn(
									"absolute left-0 block h-px w-4 bg-current transition-all duration-700 ease-fluid",
									menuOpen ? "top-1.5 -rotate-45" : "top-3",
								)}
							/>
						</span>
					</Button>
				</div>
			</div>

			<nav
				id="marketing-mobile-nav"
				aria-label="Sections"
				hidden={!menuOpen}
				className="border-t px-4 py-4 md:hidden"
			>
				<ul className="grid gap-3">
					{NAV_LINKS.map((link) => (
						<li key={link.href}>
							<a
								href={link.href}
								onClick={() => setMenuOpen(false)}
								className="block py-1 text-muted-foreground text-sm transition-colors duration-700 ease-fluid hover:text-foreground"
							>
								{link.label}
							</a>
						</li>
					))}
				</ul>
				<div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
					{session ? (
						<Button
							render={<Link href="/dashboard" />}
							nativeButton={false}
							className="rounded-full text-sm"
							size="sm"
							onClick={() => setMenuOpen(false)}
						>
							Open your console
						</Button>
					) : (
						<>
							<Button
								render={<Link href="/login" />}
								nativeButton={false}
								className="rounded-full text-sm"
								size="sm"
								onClick={() => setMenuOpen(false)}
							>
								Create your account
							</Button>
							<Button
								render={<Link href="/login" />}
								nativeButton={false}
								variant="outline"
								className="rounded-full text-sm"
								size="sm"
								onClick={() => setMenuOpen(false)}
							>
								Sign in
							</Button>
						</>
					)}
				</div>
			</nav>
		</header>
	);
}
