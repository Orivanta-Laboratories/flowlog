const PHASES = [
	{
		stamp: "09:12",
		title: "You work",
		body: "The agent notes which window has focus and which branch you're on, a few seconds at a time. Idle gaps get dropped rather than billed.",
		detail: "Nothing is collected outside the hours you set.",
	},
	{
		stamp: "17:30",
		title: "You review",
		body: "Your day arrives as blocks, already grouped and already labelled, with the reason for each label next to it: your rule, something you confirmed before, or the cloud model.",
		detail: "Edit a label, merge two blocks, or split one in half.",
	},
	{
		stamp: "17:33",
		title: "You confirm",
		body: "The blocks you accept become your timesheet. The ones you don't stay suggestions and never reach an invoice.",
		detail: "Nothing is ever confirmed on your behalf.",
	},
] as const;

export function FlowTimeline() {
	return (
		<ol className="relative grid gap-8 md:grid-cols-3 md:gap-6">
			<div
				aria-hidden="true"
				className="absolute top-3 bottom-3 left-3 w-px bg-border md:top-3 md:right-3 md:bottom-auto md:left-3 md:h-px md:w-auto"
			/>
			{PHASES.map((phase, index) => (
				<li key={phase.title} className="relative pl-10 md:pt-10 md:pl-0">
					<span
						aria-hidden="true"
						className="absolute top-0 left-0 flex size-6 items-center justify-center rounded-full bg-primary font-semibold text-[11px] text-primary-foreground md:left-0"
					>
						{index + 1}
					</span>
					<p className="font-mono text-muted-foreground text-xs tabular-nums">
						{phase.stamp}
					</p>
					<h3 className="cn-font-heading mt-1 font-semibold text-lg">
						{phase.title}
					</h3>
					<p className="mt-2 flex-1 text-pretty text-muted-foreground text-sm">
						{phase.body}
					</p>
					<p className="mt-3 border-t pt-3 text-foreground text-sm">
						{phase.detail}
					</p>
				</li>
			))}
		</ol>
	);
}
