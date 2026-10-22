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
		<div className="mb-6 flex flex-wrap items-start justify-between gap-5 border-b pb-5">
			<div className="min-w-0">
				<h1 className="cn-font-heading font-semibold text-2xl text-foreground">
					{title}
				</h1>
				{description !== undefined && (
					<p className="mt-2 max-w-2xl text-pretty text-muted-foreground text-sm leading-6">
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
