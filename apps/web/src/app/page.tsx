import { Badge } from "@flowlog/ui/components/badge";
import { Button } from "@flowlog/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardTitle,
} from "@flowlog/ui/components/card";
import { Separator } from "@flowlog/ui/components/separator";
import {
	ArrowRight,
	CheckCircle2,
	GitBranch,
	Globe,
	Monitor,
	PenLine,
	ShieldCheck,
	Sparkles,
	Timer,
} from "lucide-react";
import Link from "next/link";

const TRUST_POINTS = [
	"Agent installs in a minute",
	"Local-first by default",
	"No manual timers",
] as const;

const WEEKLY_BARS = [22, 30, 26, 40, 34, 12, 8] as const;

const RECENT_ACTIVITY = [
	{ label: "Flowlog Dashboard", meta: "VS Code · main", duration: "2h 15m", status: "Confirmed" },
	{ label: "Client onboarding call", meta: "Google Meet", duration: "45m", status: "Confirmed" },
	{ label: "Billing migration", meta: "VS Code · billing-fix", duration: "1h 05m", status: "Pending" },
] as const;

const STEPS = [
	{
		number: "1",
		title: "Install the agent",
		description:
			"One binary for desktop, one extension for the browser. Sign in once and tracking starts immediately — no timers to remember.",
	},
	{
		number: "2",
		title: "Let it run in the background",
		description:
			"Flowlog watches the app, window, and git branch you're already in. Nothing to start, stop, or forget about during the day.",
	},
	{
		number: "3",
		title: "Confirm your day",
		description:
			"At the end of the day, review a suggested timesheet with labels and confidence scores already filled in. Accept or edit, never compose from scratch.",
	},
] as const;

const SOURCES = [
	{
		icon: Monitor,
		title: "Desktop agent",
		description: "Tracks the active app, window title, and idle time on macOS, Windows, and Linux.",
		status: "Runs in the background",
	},
	{
		icon: Globe,
		title: "Browser extension",
		description: "Adds the domain and tab title to your timesheet, with per-site exclusions you control.",
		status: "Pause anytime from the toolbar",
	},
	{
		icon: GitBranch,
		title: "Git activity",
		description: "Branch switches and commit subjects are matched to the time you spent, editor-agnostic.",
		status: "Works with any git client",
	},
	{
		icon: PenLine,
		title: "Manual entries",
		description: "Add or correct a block by hand for the time that happens away from a keyboard.",
		status: "Always available as a fallback",
	},
] as const;

const FEATURES = [
	{
		icon: Timer,
		title: "Zero-input tracking",
		description:
			"No timer to start or stop. Flowlog builds your timesheet from the apps, windows, and repos you already work in.",
	},
	{
		icon: GitBranch,
		title: "Git-aware by default",
		description:
			"Branch switches and commits are matched to the time you spent, editor-agnostic — VS Code, JetBrains, Vim, or the terminal.",
	},
	{
		icon: Sparkles,
		title: "Confirm, don't compose",
		description:
			"Every block ships with a suggested label and confidence score. Accept the obvious ones, edit the rest — never type from scratch.",
	},
	{
		icon: ShieldCheck,
		title: "Local-first, consent-based",
		description:
			"Window titles stay on your device by default. Nothing is sent for AI labeling unless you turn it on.",
	},
] as const;

export default function Home() {
	return (
		<div className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
			<section className="grid items-center gap-10 pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
				<div>
					<Badge variant="secondary" className="mb-4">
						One agent · every source
					</Badge>
					<h1 className="mb-4 text-balance font-semibold text-4xl tracking-tight sm:text-5xl">
						The timesheet that fills itself in
					</h1>
					<p className="mb-6 max-w-xl text-muted-foreground">
						Flowlog watches the app, window, and git branch you're already in,
						turns it into a suggested timesheet at the end of the day, and asks
						"is this right?" instead of "what did you do?"
					</p>
					<div className="mb-6 flex flex-wrap items-center gap-3">
						<Button render={<Link href="/dashboard" />} size="lg">
							Open dashboard
							<ArrowRight data-icon="inline-end" />
						</Button>
						<Button render={<Link href="/login" />} variant="outline" size="lg">
							Sign in
						</Button>
					</div>
					<ul className="flex flex-wrap gap-x-5 gap-y-2 text-muted-foreground text-xs">
						{TRUST_POINTS.map((point) => (
							<li key={point} className="flex items-center gap-1.5">
								<CheckCircle2 className="size-3.5 text-primary" aria-hidden="true" />
								{point}
							</li>
						))}
					</ul>
				</div>

				<Card className="shadow-sm">
					<CardContent className="pt-4">
						<p className="mb-1 text-muted-foreground text-xs">Tracked this week</p>
						<div className="mb-4 flex items-baseline gap-2">
							<span className="font-semibold text-3xl tracking-tight">32h 40m</span>
							<span className="text-primary text-xs">+14% vs. last week</span>
						</div>
						<div className="mb-5 flex h-16 items-end gap-1.5">
							{WEEKLY_BARS.map((height, index) => (
								<div
									key={index}
									className="flex-1 rounded-none bg-primary/20 data-[current=true]:bg-primary"
									data-current={index === WEEKLY_BARS.length - 2}
									style={{ height: `${height * 2}px` }}
								/>
							))}
						</div>
						<Separator className="mb-4" />
						<p className="mb-3 text-muted-foreground text-xs">Recent activity</p>
						<ul className="space-y-3">
							{RECENT_ACTIVITY.map((entry) => (
								<li key={entry.label} className="flex items-center justify-between gap-3 text-sm">
									<div className="min-w-0">
										<p className="truncate font-medium">{entry.label}</p>
										<p className="truncate text-muted-foreground text-xs">{entry.meta}</p>
									</div>
									<div className="flex shrink-0 items-center gap-2">
										<span className="text-xs">{entry.duration}</span>
										<Badge variant={entry.status === "Confirmed" ? "default" : "secondary"}>
											{entry.status}
										</Badge>
									</div>
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			</section>

			<section className="border-border border-t pt-16 pb-16 text-center">
				<p className="mb-2 font-medium text-primary text-xs uppercase tracking-wide">
					Getting started
				</p>
				<h2 className="mb-3 text-balance font-semibold text-2xl tracking-tight sm:text-3xl">
					Three steps, not three weeks
				</h2>
				<p className="mx-auto mb-12 max-w-md text-muted-foreground text-sm">
					No spreadsheets to maintain and nothing to remember to start.
				</p>
				<div className="grid gap-8 text-left sm:grid-cols-3">
					{STEPS.map((step) => (
						<div key={step.number}>
							<span className="mb-3 inline-flex size-7 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-sm">
								{step.number}
							</span>
							<h3 className="mb-1.5 font-medium">{step.title}</h3>
							<p className="text-muted-foreground text-sm">{step.description}</p>
						</div>
					))}
				</div>
			</section>

			<section className="pb-16">
				<p className="mb-1 font-medium text-primary text-xs uppercase tracking-wide">
					Sources
				</p>
				<h2 className="mb-8 text-balance font-semibold text-2xl tracking-tight sm:text-3xl">
					Every source you actually work in
				</h2>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{SOURCES.map(({ icon: Icon, title, description, status }) => (
						<Card key={title}>
							<CardContent className="pt-4">
								<div className="mb-3 flex size-9 items-center justify-center rounded-none bg-primary/10">
									<Icon className="size-4.5 text-primary" aria-hidden="true" />
								</div>
								<CardTitle className="mb-1.5">{title}</CardTitle>
								<CardDescription className="mb-3">{description}</CardDescription>
								<Separator className="mb-3" />
								<p className="text-muted-foreground text-xs">{status}</p>
							</CardContent>
						</Card>
					))}
				</div>
			</section>

			<section className="grid gap-4 pb-16 sm:grid-cols-2">
				{FEATURES.map(({ icon: Icon, title, description }) => (
					<Card key={title}>
						<CardContent className="flex gap-3 pt-4">
							<Icon
								className="mt-0.5 h-5 w-5 shrink-0 text-primary"
								aria-hidden="true"
							/>
							<div>
								<CardTitle className="mb-1">{title}</CardTitle>
								<CardDescription>{description}</CardDescription>
							</div>
						</CardContent>
					</Card>
				))}
			</section>

			<section className="rounded-none bg-primary px-6 py-14 text-center sm:px-12">
				<h2 className="mb-3 text-balance font-semibold text-2xl text-primary-foreground tracking-tight sm:text-3xl">
					Ready to stop guessing where your day went?
				</h2>
				<p className="mx-auto mb-8 max-w-md text-primary-foreground/80 text-sm">
					Install the agent, wire up the browser extension, and your first
					suggested timesheet is ready by end of day.
				</p>
				<div className="flex flex-wrap items-center justify-center gap-3">
					<Button render={<Link href="/dashboard" />} variant="secondary" size="lg">
						Open dashboard
						<ArrowRight data-icon="inline-end" />
					</Button>
					<Button render={<Link href="/login" />} variant="outline" size="lg" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
						Sign in
					</Button>
				</div>
			</section>
		</div>
	);
}
