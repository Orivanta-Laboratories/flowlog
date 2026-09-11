import { Badge } from "@flowlog/ui/components/badge";
import { cn } from "@flowlog/ui/lib/utils";
import { Check, GitBranch, Globe, Video } from "lucide-react";

const EXAMPLE_BLOCKS = [
	{
		time: "09:12 – 10:48",
		duration: "1h 36m",
		icon: GitBranch,
		context: "Code · flowlog · fix/overnight-shift",
		label: "Overnight shift rollover",
		project: "Flowlog",
		projectClass: "bg-chart-1",
		source: "Your rule",
		confidence: "98%",
		state: "ready",
	},
	{
		time: "11:05 – 11:38",
		duration: "33m",
		icon: Video,
		context: "Meet · Weekly with Meridian Health",
		label: "Weekly check in",
		project: "Meridian Health",
		projectClass: "bg-chart-3",
		source: "Past labels",
		confidence: "81%",
		state: "ready",
	},
	{
		time: "13:20 – 14:02",
		duration: "42m",
		icon: Globe,
		context: "Firefox · docs.rs · chrono",
		label: "Reading timezone docs",
		project: null,
		projectClass: null,
		source: "AI",
		confidence: "54%",
		state: "needs-you",
	},
] as const;

export function ExampleReview() {
	return (
		<figure className="m-0">
			<div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
				<div className="flex items-center justify-between gap-4 border-b bg-muted/50 px-4 py-3">
					<div>
						<p className="cn-font-heading font-medium text-sm">
							Tuesday, 3 March
						</p>
						<p className="text-muted-foreground text-xs">
							2h 51m tracked · 3 blocks waiting on you
						</p>
					</div>
					<Badge variant="outline" className="rounded-full bg-background">
						Example
					</Badge>
				</div>

				<ul className="divide-y">
					{EXAMPLE_BLOCKS.map((block) => (
						<li key={block.time} className="grid gap-3 px-4 py-4">
							<div className="flex flex-wrap items-center gap-2">
								<block.icon
									className="size-4 shrink-0 text-muted-foreground"
									aria-hidden="true"
								/>
								<span className="font-mono text-muted-foreground text-xs">
									{block.context}
								</span>
							</div>

							<div className="flex flex-wrap items-center justify-between gap-3">
								<div className="min-w-0">
									<p className="font-medium text-sm">{block.label}</p>
									<p className="text-muted-foreground text-xs tabular-nums">
										{block.time} · {block.duration}
									</p>
								</div>

								<div className="flex flex-wrap items-center gap-2">
									{block.project !== null && (
										<Badge
											variant="outline"
											className="gap-2 rounded-full bg-background"
										>
											<span
												aria-hidden="true"
												className={cn(
													"size-2 rounded-full",
													block.projectClass,
												)}
											/>
											{block.project}
										</Badge>
									)}
									<Badge
										variant={
											block.state === "needs-you" ? "destructive" : "secondary"
										}
										className="rounded-full tabular-nums"
									>
										{block.source} · {block.confidence}
									</Badge>
									{block.state === "ready" ? (
										<span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 font-medium text-primary-foreground text-xs">
											<Check className="size-3" aria-hidden="true" />
											Confirm
										</span>
									) : (
										<span className="inline-flex items-center rounded-full border px-3 py-1 font-medium text-muted-foreground text-xs">
											Needs a look
										</span>
									)}
								</div>
							</div>
						</li>
					))}
				</ul>
			</div>
			<figcaption className="mt-4 text-muted-foreground text-sm">
				An example of the review screen, not real tracked time. The percentage
				is how sure Flowlog is about the label, never proof the task is
				finished.
			</figcaption>
		</figure>
	);
}
