import { Badge } from "@flowlog/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardTitle,
} from "@flowlog/ui/components/card";
import { Separator } from "@flowlog/ui/components/separator";
import {
	CheckCircle2,
	GitBranch,
	Globe,
	Lock,
	Monitor,
	PenLine,
	Sparkles,
	Timer,
} from "lucide-react";

import { MarketingCta } from "@/components/marketing-cta";

const TRUST_POINTS = [
	"Installs in about a minute",
	"Stays on your device",
	"No timers, ever",
] as const;

const WEEKLY_BARS = [22, 30, 26, 40, 34, 12, 8] as const;

const RECENT_ACTIVITY = [
	{
		label: "Flowlog dashboard",
		meta: "VS Code · main",
		duration: "2h 15m",
		status: "Confirmed",
	},
	{
		label: "Client onboarding call",
		meta: "Google Meet",
		duration: "45m",
		status: "Confirmed",
	},
	{
		label: "Billing migration",
		meta: "VS Code · billing fix",
		duration: "1h 05m",
		status: "Pending",
	},
] as const;

const FEATURES = [
	{
		icon: Timer,
		title: "No timer to remember",
		description:
			"There's no start or stop button. Flowlog builds your timesheet from the apps, windows, and repos you're already working in.",
	},
	{
		icon: GitBranch,
		title: "Understands git",
		description:
			"Branch switches and commits get matched to the time you spent, no matter which editor or terminal you use.",
	},
	{
		icon: Sparkles,
		title: "Confirm, don't compose",
		description:
			"Every block ships with a suggested label and a confidence score. Accept the obvious ones, edit the rest — you never type a timesheet from scratch.",
	},
	{
		icon: Lock,
		title: "Private by default",
		description:
			"Window titles never leave your device unless you turn on AI labeling yourself.",
	},
] as const;

const SOURCES = [
	{
		icon: Monitor,
		title: "Desktop agent",
		description:
			"Tracks the active app, window title, and idle time in the background. Linux today, with more platforms on the way.",
		status: "Runs as a background service",
	},
	{
		icon: Globe,
		title: "Browser extension",
		description:
			"Adds the domain and tab title to your timesheet, with per site exclusions you control.",
		status: "Works in Chrome, Edge, and Brave",
	},
	{
		icon: GitBranch,
		title: "Git activity",
		description:
			"Branch switches and commit subjects are matched to the time you spent, in any editor.",
		status: "Works with any git client",
	},
	{
		icon: PenLine,
		title: "Manual entries",
		description:
			"Add or correct a block by hand for time that happens away from a keyboard.",
		status: "Always available as a fallback",
	},
] as const;

const STEPS = [
	{
		number: "1",
		title: "Install the agent",
		description:
			"One binary for desktop, one extension for the browser. Sign in once and tracking starts right away — no timer to remember.",
	},
	{
		number: "2",
		title: "Let it run in the background",
		description:
			"Flowlog watches the app, window, and git branch you're already in. There's nothing to start, stop, or forget about during the day.",
	},
	{
		number: "3",
		title: "Confirm your day",
		description:
			"At the end of the day, review a suggested timesheet with labels and confidence scores already filled in. Accept what's right, edit the rest.",
	},
] as const;

const FAQS = [
	{
		question: "Which platforms does the desktop agent support?",
		answer:
			"The desktop agent runs on Linux today, using GNOME or X11 to detect the focused window. Support for other platforms is on the roadmap.",
	},
	{
		question: "Which browsers does the extension work with?",
		answer:
			"Any Chromium based browser: Chrome, Edge, and Brave. It adds the site domain and tab title to your timesheet.",
	},
	{
		question: "What data does Flowlog actually collect?",
		answer:
			"App name, window title, site domain, idle state, and git branch or commit subject. No keystrokes, no screenshots, and no file contents are ever recorded.",
	},
	{
		question: "Can I exclude certain apps or sites?",
		answer:
			"Yes. Exclusion lists for app names, window title patterns, and domains are applied before anything is queued, so excluded activity never touches disk or the network.",
	},
	{
		question: "Do I need to keep a tab or window open?",
		answer:
			"No. The desktop agent runs as a background service and the extension runs in a browser service worker, so tracking keeps going without anything pinned open.",
	},
	{
		question: "What if I forget to pause it?",
		answer:
			"Pause tracking any time from the browser toolbar popup or the desktop tray icon. Paused time is never queued or sent, so there's nothing to clean up after.",
	},
	{
		question: "What happens if my connection drops?",
		answer:
			"Events queue to disk until they're delivered successfully, so a flaky connection doesn't cost you a block of your day.",
	},
] as const;

export default function Home() {
	return (
		<>
			<section className="mx-auto max-w-6xl px-4 pt-16 pb-20 sm:pt-24">
				<div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
					<div>
						<Badge variant="secondary" className="mb-5 rounded-full">
							Built for people who forget to start timers
						</Badge>
						<h1 className="mb-5 max-w-2xl text-balance font-semibold text-5xl tracking-tight sm:text-6xl">
							The timesheet that fills itself in
						</h1>
						<p className="mb-8 max-w-lg text-pretty text-lg text-muted-foreground">
							Flowlog watches the app, window, and git branch you're already in,
							turns it into a suggested timesheet at the end of the day, and
							asks &ldquo;is this right?&rdquo; instead of &ldquo;what did you
							do?&rdquo;
						</p>
						<div className="mb-7 flex flex-wrap items-center gap-3">
							<MarketingCta />
						</div>
						<ul className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground text-sm">
							{TRUST_POINTS.map((point) => (
								<li key={point} className="flex items-center gap-1.5">
									<CheckCircle2
										className="size-4 text-primary"
										aria-hidden="true"
									/>
									{point}
								</li>
							))}
						</ul>
					</div>

					<Card className="rounded-2xl text-sm shadow-sm">
						<CardContent className="pt-5">
							<p className="mb-1 text-muted-foreground text-sm">
								Tracked this week
							</p>
							<div className="mb-5 flex items-baseline gap-2">
								<span className="font-semibold text-3xl tracking-tight">
									32h 40m
								</span>
								<span className="text-primary text-sm">+14% vs last week</span>
							</div>
							<div
								className="mb-5 flex h-16 items-end gap-1.5"
								role="img"
								aria-label="Hours tracked per day this week"
							>
								{WEEKLY_BARS.map((height, index) => (
									<div
										key={index}
										className="flex-1 rounded-t-md bg-primary/20 data-[current=true]:bg-primary"
										data-current={index === WEEKLY_BARS.length - 2}
										style={{ height: `${height * 2}px` }}
									/>
								))}
							</div>
							<Separator className="mb-4" />
							<p className="mb-3 text-muted-foreground text-sm">
								Recent activity
							</p>
							<ul className="space-y-3">
								{RECENT_ACTIVITY.map((entry) => (
									<li
										key={entry.label}
										className="flex items-center justify-between gap-3"
									>
										<div className="min-w-0">
											<p className="truncate font-medium">{entry.label}</p>
											<p className="truncate text-muted-foreground text-xs">
												{entry.meta}
											</p>
										</div>
										<div className="flex shrink-0 items-center gap-2">
											<span className="text-xs">{entry.duration}</span>
											<Badge
												variant={
													entry.status === "Confirmed" ? "default" : "secondary"
												}
												className="rounded-full"
											>
												{entry.status}
											</Badge>
										</div>
									</li>
								))}
							</ul>
						</CardContent>
					</Card>
				</div>
			</section>

			<section className="border-border border-t bg-muted/30 py-20">
				<p className="mx-auto max-w-2xl text-balance px-4 text-center font-semibold text-3xl tracking-tight sm:text-4xl">
					Time tracking should describe your day.
					<br />
					Not interrupt it.
				</p>
			</section>

			<section
				id="product"
				className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20"
			>
				<p className="mb-1 font-medium text-primary text-sm">Product</p>
				<h2 className="mb-3 max-w-2xl text-balance font-semibold text-3xl tracking-tight sm:text-4xl">
					Every source you actually work in
				</h2>
				<p className="mb-10 max-w-xl text-muted-foreground">
					Four inputs, one timesheet — nothing you do during the day falls
					through a gap.
				</p>
				<div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{SOURCES.map(({ icon: Icon, title, description, status }) => (
						<Card key={title} className="rounded-2xl">
							<CardContent className="pt-5">
								<div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/10">
									<Icon className="size-5 text-primary" aria-hidden="true" />
								</div>
								<CardTitle className="mb-1.5 text-base">{title}</CardTitle>
								<CardDescription className="mb-4 text-sm">
									{description}
								</CardDescription>
								<Separator className="mb-3" />
								<p className="text-muted-foreground text-xs">{status}</p>
							</CardContent>
						</Card>
					))}
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					{FEATURES.map(({ icon: Icon, title, description }) => (
						<Card key={title} className="rounded-2xl">
							<CardContent className="flex gap-4 pt-5">
								<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
									<Icon className="size-5 text-primary" aria-hidden="true" />
								</div>
								<div>
									<CardTitle className="mb-1 text-base">{title}</CardTitle>
									<CardDescription className="text-sm">
										{description}
									</CardDescription>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</section>

			<section
				id="how-it-works"
				className="scroll-mt-16 border-border border-t bg-muted/30 py-20 text-center"
			>
				<div className="mx-auto max-w-6xl px-4">
					<p className="mb-2 font-medium text-primary text-sm">
						Getting started
					</p>
					<h2 className="mb-3 text-balance font-semibold text-3xl tracking-tight sm:text-4xl">
						Three steps, not three weeks
					</h2>
					<p className="mx-auto mb-14 max-w-md text-muted-foreground">
						No spreadsheets to maintain and nothing to remember to start.
					</p>
					<div className="grid gap-10 text-left sm:grid-cols-3">
						{STEPS.map((step) => (
							<div key={step.number}>
								<span className="mb-4 inline-flex size-8 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-sm">
									{step.number}
								</span>
								<h3 className="mb-2 font-medium text-lg">{step.title}</h3>
								<p className="text-muted-foreground text-sm">
									{step.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<section id="faq" className="mx-auto max-w-3xl scroll-mt-16 px-4 py-20">
				<p className="mb-2 text-center font-medium text-primary text-sm">FAQ</p>
				<h2 className="mb-10 text-balance text-center font-semibold text-3xl tracking-tight sm:text-4xl">
					Questions people actually ask
				</h2>
				<div className="divide-y divide-border rounded-2xl border border-border">
					{FAQS.map((faq) => (
						<details key={faq.question} className="group p-5 open:pb-5">
							<summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
								{faq.question}
								<span
									aria-hidden="true"
									className="shrink-0 text-muted-foreground transition-transform group-open:rotate-45"
								>
									+
								</span>
							</summary>
							<p className="mt-3 text-muted-foreground text-sm">{faq.answer}</p>
						</details>
					))}
				</div>
			</section>

			<section className="mx-auto max-w-6xl px-4 pb-24">
				<div className="rounded-3xl bg-primary px-6 py-16 text-center sm:px-12">
					<h2 className="mb-3 text-balance font-semibold text-3xl text-primary-foreground tracking-tight sm:text-4xl">
						Stop guessing where your day went
					</h2>
					<p className="mx-auto mb-8 max-w-md text-primary-foreground/80">
						Install the agent, wire up the browser extension, and your first
						suggested timesheet is waiting for you by tonight.
					</p>
					<div className="flex flex-wrap items-center justify-center gap-3">
						<MarketingCta inverted />
					</div>
				</div>
			</section>
		</>
	);
}
