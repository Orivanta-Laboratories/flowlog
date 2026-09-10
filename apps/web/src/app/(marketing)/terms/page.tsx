import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Terms of Service",
};

export default function TermsOfServicePage() {
	return (
		<div className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
			<h1 className="mb-2 text-balance font-semibold text-4xl tracking-tight sm:text-5xl">
				Terms of Service
			</h1>
			<p className="mb-8 text-muted-foreground text-sm">
				Last updated September 10, 2026
			</p>

			<div className="mb-12 rounded-2xl border border-border bg-muted/30 p-5 text-sm">
				<p className="mb-1 font-medium">Where this document actually stands</p>
				<p className="text-muted-foreground">
					This is a good-faith draft, written to describe what Flowlog actually
					does today as accurately as we can. It hasn't been reviewed by a
					lawyer. Orivanta Labs needs to get real legal review on this before
					it's treated as binding for real users — until then, read it as an
					honest description of the product, not a finished legal document.
				</p>
			</div>

			<div className="space-y-10 text-base leading-relaxed">
				<section>
					<p>
						These terms cover using Flowlog — the desktop agent, the browser
						extension, and the web app. By signing in, you're agreeing to them.
					</p>
				</section>

				<section>
					<h2 className="mb-3 font-semibold text-2xl tracking-tight">
						This is early-stage software
					</h2>
					<p>
						Flowlog is at version 0.1.0, across the web app, the browser
						extension, the desktop agent, and the GNOME extension. That means
						what's here: no uptime guarantee, no support SLA, and features that
						are still actively changing. Things will break sometimes. We're
						building this in the open at this stage, not promising the stability
						of mature, established software.
					</p>
				</section>

				<section>
					<h2 className="mb-3 font-semibold text-2xl tracking-tight">
						Accounts and organizations
					</h2>
					<p className="mb-4">
						Every account belongs to exactly one organization, always — there is
						no multi-org membership and no switching between organizations on
						one account. If you need to be part of a second organization, that
						has to be a second account.
					</p>
					<p className="mb-4">
						When you sign up without an invitation, you get your own
						organization and you're its owner. When you accept an invitation
						into someone else's organization, you become a member of that
						organization instead of getting one of your own.
					</p>
					<p>
						An organization's owner can see every member's tracked time and an
						organization-wide activity heatmap. Members can see only their own
						tracked time. Accepting an invitation into an organization means
						accepting that the owner can see your data — see the Privacy Policy
						for the detail, and don't accept an invitation from an organization
						you don't want having that visibility.
					</p>
				</section>

				<section>
					<h2 className="mb-3 font-semibold text-2xl tracking-tight">
						Acceptable use
					</h2>
					<ul className="list-disc space-y-2 pl-5">
						<li>One account per person. Don't share credentials.</li>
						<li>
							Don't try to work around the one-account-one-organization limit —
							for example, by creating multiple accounts to be visible to, or
							hidden from, more than one organization's owner.
						</li>
						<li>
							Don't try to access another user's tracked time, another
							organization's data, or another account's device tokens.
						</li>
						<li>
							Don't use the API, the desktop agent, or the browser extension to
							send us data that isn't actually yours.
						</li>
					</ul>
				</section>

				<section>
					<h2 className="mb-3 font-semibold text-2xl tracking-tight">
						Your tracking data
					</h2>
					<p>
						What Flowlog collects, and how you can limit it, is described in
						full in the{" "}
						<a href="/privacy" className="underline underline-offset-4">
							Privacy Policy
						</a>
						. In short: app names, window titles, idle state, git branch and
						commit subjects from the desktop agent (and, if you've installed it,
						the GNOME extension); domain and tab title from the browser
						extension; and anything you enter manually. You're responsible for
						using the exclusion settings for anything you don't want tracked at
						all, and for what you choose to have open on a device that's running
						the agent.
					</p>
				</section>

				<section>
					<h2 className="mb-3 font-semibold text-2xl tracking-tight">
						No warranty
					</h2>
					<p>
						Flowlog is provided as-is, without warranty of any kind, express or
						implied. We don't guarantee it will be available, error-free, or fit
						for a particular purpose. In particular: a suggested timesheet is a
						suggestion — you're responsible for reviewing and confirming it
						before relying on it for billing, payroll, or anything else with
						financial consequences.
					</p>
				</section>

				<section>
					<h2 className="mb-3 font-semibold text-2xl tracking-tight">
						Limitation of liability
					</h2>
					<p>
						To the extent the law allows it, Orivanta Labs isn't liable for
						indirect, incidental, or consequential damages arising from your use
						of Flowlog — including lost time, lost data, or a timesheet that
						turned out to be wrong. This is pre-launch software; use it with
						that in mind, especially for anything business-critical.
					</p>
				</section>

				<section>
					<h2 className="mb-3 font-semibold text-2xl tracking-tight">
						Changes to these terms
					</h2>
					<p>
						We'll update this page as the product changes, especially as more
						platforms and features ship. We'll update the date at the top when
						we do.
					</p>
				</section>

				<section>
					<h2 className="mb-3 font-semibold text-2xl tracking-tight">
						Questions
					</h2>
					<p>
						If you have questions about these terms, reach out to the Orivanta
						Labs team directly.
					</p>
				</section>
			</div>
		</div>
	);
}
