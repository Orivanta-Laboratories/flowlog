import { Badge } from "@flowlog/ui/components/badge";
import { Separator } from "@flowlog/ui/components/separator";
import {
	Eye,
	EyeOff,
	GitBranch,
	Globe,
	Keyboard,
	Laptop,
	PauseCircle,
	PenLine,
} from "lucide-react";
import type { Metadata } from "next";
import { ExampleReview } from "@/components/marketing/example-review";
import { FlowTimeline } from "@/components/marketing/flow-timeline";
import { Reveal } from "@/components/marketing/reveal";
import { TaglineReveal } from "@/components/marketing/tagline-reveal";
import { MarketingCta } from "@/components/marketing-cta";

export const metadata: Metadata = {
	title: "Flowlog — finish work, your timesheet is already started",
	description:
		"Flowlog turns the apps, windows, and git branches you already work in into a draft timesheet you read and correct, so you stop reconstructing your day from memory.",
	alternates: { canonical: "/" },
};

const AVAILABILITY = [
	{
		icon: Laptop,
		title: "Desktop agent",
		body: "Runs as a background service and reads the focused window. Linux only today, through GNOME or X11.",
	},
	{
		icon: Globe,
		title: "Browser extension",
		body: "Adds the site and tab title from any Chromium browser: Chrome, Edge, or Brave.",
	},
	{
		icon: GitBranch,
		title: "Git activity",
		body: "Branch switches and commit subjects get matched to the time around them, in whatever editor you use.",
	},
	{
		icon: PenLine,
		title: "Your own entries",
		body: "Add or correct a block by hand for the work that happens away from a keyboard.",
	},
] as const;

const BENEFITS = [
	{
		title: "Read a draft instead of writing one",
		body: "Your evening job shrinks to reading a list and fixing the parts that are wrong.",
	},
	{
		title: "The same work gets the same label",
		body: "A rule on a branch or a repository labels that work identically every time, without asking anything.",
	},
	{
		title: "Billable time keeps its evidence",
		body: "Every block still shows the app, repository, and branch it came from, so an invoice line can be explained.",
	},
	{
		title: "Nothing counts until you say so",
		body: "A suggestion is a suggestion. Confirmation is a separate, explicit action you take.",
	},
] as const;

const COLLECTED = [
	"The name of the focused app and its window title",
	"The site domain and tab title from your browser",
	"Whether you've gone idle",
	"Your git repository, branch, and commit subjects",
	"How long each of those lasted",
] as const;

const NOT_COLLECTED = [
	"Keystrokes",
	"Screenshots or screen recording",
	"File contents",
	"Anything matching your exclusion lists",
	"Anything at all while tracking is paused",
] as const;

const FAQS = [
	{
		question: "Which platforms does the desktop agent run on?",
		answer:
			"Linux only, right now. It detects the focused window through GNOME or X11. macOS and Windows aren't supported yet, and we'd rather say so than imply otherwise.",
	},
	{
		question: "Which browsers does the extension work with?",
		answer:
			"Any Chromium based browser, so Chrome, Edge, and Brave. It contributes the site domain and tab title alongside whatever the desktop agent sees.",
	},
	{
		question: "Does my activity go to an AI model?",
		answer:
			"Only if you switch it on. Rules and your own past labels are matched locally and cover most repeat work. When nothing matches, Flowlog can ask Google Gemini for a suggested description, and it asks you to opt in first. Decline and tracking, rules, and manual review all keep working exactly as before.",
	},
	{
		question: "Does a tracked block prove the task is finished?",
		answer:
			"No, and Flowlog never claims it does. A block records where your attention was and for how long. Whether that amounted to finished work is a judgement only you can make, which is why confirming is a separate step.",
	},
	{
		question: "Can I keep some apps and sites out of it entirely?",
		answer:
			"Yes. You can exclude app names, window title patterns, and domains. Those filters run before anything is queued, so excluded activity never touches disk or the network, and the server filters uploads as a second pass.",
	},
	{
		question: "What if I forget to pause it?",
		answer:
			"Set your working hours once and collection stops outside them. You can also pause on demand from the tray icon or the extension popup. Paused time is never queued, so there's nothing to clean up afterwards.",
	},
	{
		question: "What happens if my connection drops?",
		answer:
			"Events queue on disk until they're delivered, so a flaky network costs you nothing.",
	},
	{
		question: "Who can see my tracked time?",
		answer:
			"You, and the owner of your organization. Members see only their own time. That split is enforced on the server, not by hiding links in the interface.",
	},
] as const;

export default function Home() {
	return (
		<>
			<section className="mx-auto max-w-6xl px-4 pt-16 pb-20 sm:pt-24">
				<div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
					<div>
						<Badge
							variant="outline"
							className="mb-6 rounded-full bg-card px-3 py-1"
						>
							Zero input time tracking
						</Badge>
						<h1 className="mb-6 max-w-[680px] text-balance">
							<span className="cn-font-heading block bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text font-semibold text-4xl text-transparent sm:text-5xl lg:text-6xl">
								Finish work. <br className="hidden sm:inline" />
								Your timesheet is <br className="hidden sm:inline" />
								already started.
							</span>
						</h1>
						<p className="mb-8 max-w-[680px] text-pretty text-lg text-muted-foreground">
							Flowlog watches the apps, windows, and git branches you're already
							in, then hands you a draft of your day to read and correct. You
							confirm it. You don't rebuild it from memory at 6pm.
						</p>
						<div className="mb-8 flex flex-wrap items-center gap-3">
							<MarketingCta />
						</div>
						<p className="text-muted-foreground text-sm">
							Desktop agent on Linux today. Browser extension for Chrome, Edge,
							and Brave. Cloud AI is optional and off until you accept it.
						</p>
					</div>

					<Reveal delayMs={100}>
						<ExampleReview />
					</Reveal>
				</div>
			</section>

			<section className="border-t bg-muted/30 py-24">
				<div className="mx-auto max-w-6xl px-4 text-center">
					<TaglineReveal />
				</div>
			</section>

			<section className="mx-auto max-w-6xl px-4 py-24">
				<div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
					<div>
						<p className="mb-2 font-medium text-primary text-sm">The problem</p>
						<h2 className="cn-font-heading mb-6 max-w-[680px] text-balance font-semibold text-3xl sm:text-4xl">
							Reconstructing a workday is guesswork dressed up as admin
						</h2>
						<p className="mb-4 text-pretty text-muted-foreground">
							By the evening the morning is gone. You remember the long meeting
							and the thing that broke, and you round everything else to the
							nearest half hour. Timers would fix it if anyone remembered to
							start them, which is the whole problem with timers.
						</p>
						<p className="text-pretty text-muted-foreground">
							Flowlog takes the opposite approach. It records what you had open
							while you had it open, then asks you a question you can actually
							answer: is this right?
						</p>
					</div>
					<Reveal className="grid gap-6 sm:grid-cols-2" delayMs={80}>
						{BENEFITS.map((benefit) => (
							<div key={benefit.title}>
								<h3 className="cn-font-heading mb-2 font-medium text-base">
									{benefit.title}
								</h3>
								<p className="text-pretty text-muted-foreground text-sm">
									{benefit.body}
								</p>
							</div>
						))}
					</Reveal>
				</div>
			</section>

			<section
				id="how-it-works"
				className="scroll-mt-16 border-t bg-muted/30 py-24"
			>
				<div className="mx-auto max-w-6xl px-4">
					<p className="mb-2 font-medium text-primary text-sm">How it works</p>
					<h2 className="cn-font-heading mb-12 max-w-[680px] text-balance font-semibold text-3xl sm:text-4xl">
						Work, review, confirm
					</h2>
					<Reveal>
						<FlowTimeline />
					</Reveal>
				</div>
			</section>

			<section
				id="what-it-sees"
				className="mx-auto max-w-6xl scroll-mt-16 px-4 py-24"
			>
				<p className="mb-2 font-medium text-primary text-sm">What it sees</p>
				<h2 className="cn-font-heading mb-4 max-w-[680px] text-balance font-semibold text-3xl sm:text-4xl">
					The honest version of what gets collected
				</h2>
				<p className="mb-12 max-w-[680px] text-pretty text-muted-foreground">
					Window titles are the most personal thing this product touches, so
					here's the full list rather than a reassuring adjective.
				</p>

				<div className="mb-16 grid gap-6 md:grid-cols-2">
					<Reveal className="rounded-2xl bg-card p-6 ring-1 ring-border">
						<div className="mb-4 flex items-center gap-3">
							<Eye className="size-4 text-primary" aria-hidden="true" />
							<h3 className="cn-font-heading font-medium text-base">
								Collected
							</h3>
						</div>
						<ul className="grid gap-3">
							{COLLECTED.map((item) => (
								<li key={item} className="flex gap-3 text-sm">
									<span
										aria-hidden="true"
										className="mt-2 size-1 shrink-0 rounded-full bg-primary"
									/>
									<span className="text-pretty text-muted-foreground">
										{item}
									</span>
								</li>
							))}
						</ul>
					</Reveal>

					<Reveal
						delayMs={80}
						className="rounded-2xl bg-card p-6 ring-1 ring-border"
					>
						<div className="mb-4 flex items-center gap-3">
							<EyeOff
								className="size-4 text-muted-foreground"
								aria-hidden="true"
							/>
							<h3 className="cn-font-heading font-medium text-base">
								Never collected
							</h3>
						</div>
						<ul className="grid gap-3">
							{NOT_COLLECTED.map((item) => (
								<li key={item} className="flex gap-3 text-sm">
									<span
										aria-hidden="true"
										className="mt-2 size-1 shrink-0 rounded-full bg-border"
									/>
									<span className="text-pretty text-muted-foreground">
										{item}
									</span>
								</li>
							))}
						</ul>
					</Reveal>
				</div>

				<h3 className="cn-font-heading mb-8 font-semibold text-2xl">
					Where the time comes from
				</h3>
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
					{AVAILABILITY.map((source, index) => (
						<Reveal
							key={source.title}
							delayMs={index * 60}
							className="rounded-2xl bg-card p-6 ring-1 ring-border"
						>
							<source.icon
								className="mb-4 size-5 text-primary"
								aria-hidden="true"
							/>
							<h4 className="cn-font-heading mb-2 font-medium text-base">
								{source.title}
							</h4>
							<p className="text-pretty text-muted-foreground text-sm">
								{source.body}
							</p>
						</Reveal>
					))}
				</div>

				<div className="mt-16 flex flex-wrap items-center gap-4 rounded-2xl bg-accent px-6 py-6 text-accent-foreground">
					<PauseCircle className="size-5 shrink-0" aria-hidden="true" />
					<p className="min-w-0 flex-1 text-pretty text-sm">
						You can pause collection from the tray icon or the extension popup,
						switch cloud AI off in Settings, and revoke any device in one click.
						Paused time is never queued, so stopping is a real stop.
					</p>
				</div>
			</section>

			<section id="faq" className="border-t bg-muted/30 py-24">
				<div className="mx-auto max-w-3xl scroll-mt-16 px-4">
					<p className="mb-2 font-medium text-primary text-sm">FAQ</p>
					<h2 className="cn-font-heading mb-12 text-balance font-semibold text-3xl sm:text-4xl">
						The questions that decide it
					</h2>
					<div className="divide-y rounded-2xl bg-card ring-1 ring-border">
						{FAQS.map((faq) => (
							<details key={faq.question} className="group px-6 py-4">
								<summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md font-medium text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
									{faq.question}
									<span
										aria-hidden="true"
										className="shrink-0 text-muted-foreground transition-transform duration-700 ease-fluid group-open:rotate-45"
									>
										+
									</span>
								</summary>
								<p className="mt-3 text-pretty text-muted-foreground text-sm">
									{faq.answer}
								</p>
							</details>
						))}
					</div>
				</div>
			</section>

			<section className="mx-auto max-w-6xl px-4 py-24">
				<div className="rounded-2xl bg-primary px-6 py-16 text-center sm:px-12">
					<h2 className="cn-font-heading mx-auto mb-4 max-w-[680px] text-balance font-semibold text-3xl text-primary-foreground sm:text-4xl">
						Stop spending your evening remembering your morning
					</h2>
					<p className="mx-auto mb-8 max-w-[680px] text-pretty text-primary-foreground/80">
						Create an account, connect a device, and the first draft of your day
						is waiting for you tonight. Keep cloud AI switched off if you'd
						rather, rules and history still do the work.
					</p>
					<div className="flex flex-wrap items-center justify-center gap-3">
						<MarketingCta inverted />
					</div>
					<Separator className="mx-auto my-8 max-w-xs bg-primary-foreground/20" />
					<p className="flex flex-wrap items-center justify-center gap-2 text-primary-foreground/70 text-sm">
						<Keyboard className="size-4" aria-hidden="true" />
						Nothing to start. Nothing to stop. Nothing confirmed without you.
					</p>
				</div>
			</section>
		</>
	);
}
