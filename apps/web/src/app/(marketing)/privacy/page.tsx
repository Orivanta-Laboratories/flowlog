import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Privacy Policy",
};

export default function PrivacyPolicyPage() {
	return (
		<div className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
			<h1 className="mb-2 text-balance font-semibold text-4xl tracking-tight sm:text-5xl">
				Privacy Policy
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
						Flowlog builds a timesheet from the apps, windows, and git branches
						you're already working in. That only works if we collect some data
						about what you're doing, so this page is about exactly what that is,
						where it comes from, and what we do — and don't do — with it.
					</p>
				</section>

				<section>
					<h2 className="mb-3 font-semibold text-2xl tracking-tight">
						What we collect, and from where
					</h2>
					<p className="mb-4">
						Flowlog has four sources of data. Nothing outside this list feeds
						your timesheet.
					</p>
					<ul className="mb-4 list-disc space-y-3 pl-5">
						<li>
							<span className="font-medium">The desktop agent.</span> While it's
							running and paired to your account, it records the name of the app
							you have focused, the focused window's title, whether you're idle,
							and — when you're in a git repository — the repository name, the
							branch you're on, and the subject line of commits you make. It
							only runs when you've installed it and signed in; nothing is
							collected before that.
						</li>
						<li>
							<span className="font-medium">
								The GNOME Shell extension (Linux/GNOME only).
							</span>{" "}
							GNOME's desktop shell doesn't hand a focused window's title to
							background processes by default — that's a deliberate security
							boundary. The extension is a separate, optional component you
							install yourself on top of the agent specifically to grant it that
							one permission. It exposes the focused window's title and app id
							over a local D-Bus service that only the Flowlog agent on that
							same machine can read. The extension itself never talks to the
							network — the only way that data reaches Flowlog is via the agent,
							as the same app name and window title described above.
						</li>
						<li>
							<span className="font-medium">The browser extension.</span> For
							Chromium-based browsers (Chrome, Edge, Brave), it records the
							domain and title of your active tab. You control exclusions per
							site.
						</li>
						<li>
							<span className="font-medium">Manual entries.</span> Anything you
							type in by hand — for time away from a keyboard, or to correct a
							block — is exactly what you typed, nothing inferred.
						</li>
					</ul>
					<p>
						We don't record keystrokes, take screenshots, or read file contents.
						Nothing about what a window title <em>says</em> beyond the literal
						string the operating system or browser reports is collected — see
						the next section for why that still matters.
					</p>
				</section>

				<section>
					<h2 className="mb-3 font-semibold text-2xl tracking-tight">
						Window titles can contain more than an app name
					</h2>
					<p>
						A window title is whatever the operating system or browser reports
						for that window — and that can incidentally include a document's
						name, a URL, part of an email subject, or a message preview,
						depending on the app. Flowlog doesn't parse or strip that out; the
						title is stored as the literal string it was given. This is inherent
						to what a window title is, not something we can fully engineer
						around, which is exactly why the exclusion controls below exist —
						use them for anything you don't want captured at all.
					</p>
				</section>

				<section>
					<h2 className="mb-3 font-semibold text-2xl tracking-tight">
						Exclusions you control
					</h2>
					<p>
						From your account settings, you can exclude specific app names,
						window title patterns, and domains. Excluded activity is filtered
						before it's queued on your device — it never touches disk or the
						network, so there's nothing to delete after the fact because it was
						never sent.
					</p>
				</section>

				<section>
					<h2 className="mb-3 font-semibold text-2xl tracking-tight">
						AI labeling is opt-in, and off by default
					</h2>
					<p className="mb-4">
						Flowlog can suggest a label for a block of tracked time using an AI
						model, but only if you turn that on yourself in your account
						settings. It's off by default.
					</p>
					<p>
						When it's on, a suggestion request sends structured signals for one
						block of time — the app name, window title, repo and branch name,
						recent commit subjects, how long the block lasted, and the names of
						your existing projects — to a language model, and asks for a short
						label, a possible project match, and a confidence score. That
						request never includes message content, keystrokes, or anything
						beyond those structured fields. If a request fails for any reason,
						no suggestion is applied — nothing is guessed or retried silently.
					</p>
				</section>

				<section>
					<h2 className="mb-3 font-semibold text-2xl tracking-tight">
						If you're part of an organization
					</h2>
					<p>
						Every Flowlog account belongs to exactly one organization. If you're
						invited into someone else's organization rather than creating your
						own, the organization's owner can see your tracked time and it
						contributes to an organization-wide activity heatmap. Other members
						can't see your data — only their own — but the owner can see
						everyone's. Know this before you accept an invitation: it is a real,
						active behavior of the product, not an edge case.
					</p>
				</section>

				<section>
					<h2 className="mb-3 font-semibold text-2xl tracking-tight">
						Retention and deletion
					</h2>
					<p className="mb-4">
						You can export your own confirmed timesheet data as CSV at any time
						from the app, for a date range you choose.
					</p>
					<p className="mb-4">
						Projects, matching rules, confirmed activity sessions, and devices
						use soft deletion: removing one marks it archived rather than
						erasing it immediately, so an accidental delete is recoverable and a
						device you revoke stops working right away without losing its
						history. We don't have a self-service "delete my account and
						everything in it" flow yet. If you want your data deleted, contact
						us directly and we'll handle it by hand — we're not going to pretend
						an automated flow exists when it doesn't.
					</p>
				</section>

				<section>
					<h2 className="mb-3 font-semibold text-2xl tracking-tight">
						What we don't do
					</h2>
					<ul className="list-disc space-y-2 pl-5">
						<li>We don't sell your data to third parties.</li>
						<li>We don't log keystrokes.</li>
						<li>We don't take screenshots.</li>
						<li>We don't read file contents.</li>
						<li>
							We don't send anything to an AI model unless you've turned AI
							labeling on yourself.
						</li>
					</ul>
				</section>

				<section>
					<h2 className="mb-3 font-semibold text-2xl tracking-tight">
						Changes to this policy
					</h2>
					<p>
						Flowlog is early-stage software and this policy will change as the
						product does — most notably once the GNOME extension and other
						platforms ship more broadly. We'll update the date at the top of
						this page when that happens.
					</p>
				</section>

				<section>
					<h2 className="mb-3 font-semibold text-2xl tracking-tight">
						Questions
					</h2>
					<p>
						If you have questions about any of this, or want your data deleted,
						reach out to the Orivanta Labs team directly.
					</p>
				</section>
			</div>
		</div>
	);
}
