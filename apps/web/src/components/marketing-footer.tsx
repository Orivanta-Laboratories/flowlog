import Link from "next/link";

const PRODUCT_LINKS = [
	{ href: "#product", label: "Features" },
	{ href: "#how-it-works", label: "How it works" },
	{ href: "#faq", label: "FAQ" },
] as const;

const ACCOUNT_LINKS = [
	{ href: "/login", label: "Sign in" },
	{ href: "/login", label: "Get started" },
] as const;

export default function MarketingFooter() {
	return (
		<footer className="border-border border-t">
			<div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-[1.5fr_1fr_1fr_1fr]">
				<div>
					<p className="mb-2 font-semibold text-sm tracking-tight">Flowlog</p>
					<p className="max-w-xs text-muted-foreground text-sm">
						The timesheet that fills itself in from the apps, windows, and git
						branches you already work in.
					</p>
				</div>
				<div>
					<p className="mb-3 font-medium text-sm">Product</p>
					<ul className="space-y-2 text-muted-foreground text-sm">
						{PRODUCT_LINKS.map((link) => (
							<li key={link.label}>
								<a
									href={link.href}
									className="transition-colors hover:text-foreground"
								>
									{link.label}
								</a>
							</li>
						))}
					</ul>
				</div>
				<div>
					<p className="mb-3 font-medium text-sm">Account</p>
					<ul className="space-y-2 text-muted-foreground text-sm">
						{ACCOUNT_LINKS.map((link) => (
							<li key={link.label}>
								<Link
									href={link.href}
									className="transition-colors hover:text-foreground"
								>
									{link.label}
								</Link>
							</li>
						))}
					</ul>
				</div>
				<div>
					<p className="mb-3 font-medium text-sm">Legal</p>
					<ul className="space-y-2 text-muted-foreground text-sm">
						<li>
							<Link
								href="/privacy"
								className="transition-colors hover:text-foreground"
							>
								Privacy Policy
							</Link>
						</li>
						<li>
							<Link
								href="/terms"
								className="transition-colors hover:text-foreground"
							>
								Terms of Service
							</Link>
						</li>
					</ul>
				</div>
			</div>
			<div className="border-border border-t px-4 py-4">
				<p className="mx-auto max-w-6xl text-muted-foreground text-xs">
					© {new Date().getFullYear()} Orivanta Labs. Flowlog is a product of
					Orivanta Labs.
				</p>
			</div>
		</footer>
	);
}
