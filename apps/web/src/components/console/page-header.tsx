export function PageHeader({
	title,
	description,
	actions,
}: {
	title: string;
	description?: string;
	actions?: React.ReactNode;
}) {
	return (
		<div className="mb-6 flex flex-wrap items-start justify-between gap-3">
			<div className="min-w-0">
				<h1 className="cn-font-heading font-semibold text-foreground text-xl">
					{title}
				</h1>
				{description !== undefined && (
					<p className="mt-1 max-w-prose text-pretty text-muted-foreground text-sm">
						{description}
					</p>
				)}
			</div>
			{actions !== undefined && (
				<div className="flex shrink-0 items-center gap-2">{actions}</div>
			)}
		</div>
	);
}
