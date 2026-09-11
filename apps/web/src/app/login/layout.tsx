import type { Metadata } from "next";
import Link from "next/link";

import { ModeToggle } from "@/components/mode-toggle";

export const metadata: Metadata = {
	title: "Sign in",
	robots: { index: false, follow: false },
};

const PROMISES = [
	"No timer to start, and none to forget.",
	"Your rules and past labels run on your own machine.",
	"Nothing counts as work until you confirm it.",
] as const;

export default function LoginLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div className="grid min-h-svh lg:grid-cols-2">
			<div className="flex flex-col px-4 py-6 sm:px-8">
				<header className="flex items-center justify-between gap-4">
					<Link
						href="/"
						className="flex items-center gap-2 rounded-md font-semibold text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						<span
							aria-hidden="true"
							className="flex size-6 items-center justify-center rounded-md bg-primary font-semibold text-[11px] text-primary-foreground"
						>
							FL
						</span>
						Flowlog
					</Link>
					<ModeToggle />
				</header>
				<main className="flex flex-1 items-center justify-center py-12">
					{children}
				</main>
			</div>

			<aside className="hidden flex-col justify-between border-l bg-muted/40 px-12 py-16 lg:flex">
				<p className="cn-font-heading max-w-md text-balance font-semibold text-3xl">
					Finish work. Your timesheet is already started.
				</p>
				<ul className="grid gap-4">
					{PROMISES.map((promise) => (
						<li key={promise} className="flex gap-3 text-sm">
							<span
								aria-hidden="true"
								className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
							/>
							<span className="text-pretty text-muted-foreground">
								{promise}
							</span>
						</li>
					))}
				</ul>
				<p className="text-muted-foreground text-xs">
					Desktop agent on Linux today. Browser extension for Chrome, Edge, and
					Brave.
				</p>
			</aside>
		</div>
	);
}
