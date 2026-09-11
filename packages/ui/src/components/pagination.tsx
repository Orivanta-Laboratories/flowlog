import { Button } from "@flowlog/ui/components/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
	page,
	pageCount,
	onPageChange,
}: {
	page: number;
	pageCount: number;
	onPageChange: (page: number) => void;
}) {
	if (pageCount <= 1) return null;
	return (
		<nav
			className="flex items-center justify-between border-t px-4 py-3"
			aria-label="Pagination"
		>
			<p className="text-muted-foreground text-sm">
				Page {page} of {pageCount}
			</p>
			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(page - 1)}
					disabled={page === 1}
				>
					<ChevronLeft data-icon="inline-start" /> Previous
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(page + 1)}
					disabled={page === pageCount}
				>
					Next <ChevronRight data-icon="inline-end" />
				</Button>
			</div>
		</nav>
	);
}
