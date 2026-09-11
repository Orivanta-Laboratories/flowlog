import Link from "next/link";

const SECTION_LINKS = [
	{ href: "#how-it-works", label: "How it works" },
	{ href: "#what-it-sees", label: "What it sees" },
	{ href: "#faq", label: "FAQ" },
] as const;

export default function MarketingFooter() {
	return (
		<footer className="border-t">
			<div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:grid-cols-[1.5fr_1fr_1fr]">
				<div>
					<p className="mb-3 flex items-center gap-2 font-semibold text-sm">
						<span
							aria-hidden="true"
							className="flex size-6 items-center justify-center rounded-md bg-primary font-semibold text-[11px] text-primary-foreground"
						>
							FL
						</span>
						Flowlog
					</p>
					<p className="max-w-xs text-pretty text-muted-foreground text-sm">
						A draft timesheet built from the apps, windows, and git branches you
						already work in. You read it and confirm it.
					</p>
				</div>
				<div>
					<p className="mb-4 font-medium text-sm">Product</p>
					<ul className="grid gap-3 text-muted-foreground text-sm">
						{SECTION_LINKS.map((link) => (
							<li key={link.label}>
								<a
									href={link.href}
									className="rounded-md transition-colors duration-700 ease-fluid hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
								>
									{link.label}
								</a>
							</li>
						))}
						<li>
							<Link
								href="/login"
								className="rounded-md transition-colors duration-700 ease-fluid hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
							>
								Sign in
							</Link>
						</li>
					</ul>
				</div>
				<div>
					<p className="mb-4 font-medium text-sm">Legal</p>
					<ul className="grid gap-3 text-muted-foreground text-sm">
						<li>
							<Link
								href="/privacy"
								className="rounded-md transition-colors duration-700 ease-fluid hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
							>
								Privacy policy
							</Link>
						</li>
						<li>
							<Link
								href="/terms"
								className="rounded-md transition-colors duration-700 ease-fluid hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
							>
								Terms of service
							</Link>
						</li>
					</ul>
				</div>
			</div>
			<div className="border-t px-4 py-6">
				<p className="mx-auto max-w-6xl text-muted-foreground text-xs">
					© {new Date().getFullYear()} Orivanta Labs. Flowlog is a product of
					Orivanta Labs.
				</p>
			</div>
		</footer>
	);
}
