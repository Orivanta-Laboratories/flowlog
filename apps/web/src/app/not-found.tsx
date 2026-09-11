import { Button } from "@flowlog/ui/components/button";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Page not found",
	robots: { index: false, follow: false },
};

export default function NotFound() {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center px-4 py-16 text-center">
			<p className="mb-4 flex items-center gap-2 font-semibold text-sm">
				<span
					aria-hidden="true"
					className="flex size-6 items-center justify-center rounded-md bg-primary font-semibold text-[11px] text-primary-foreground"
				>
					FL
				</span>
				Flowlog
			</p>
			<h1 className="cn-font-heading mb-3 max-w-md text-balance font-semibold text-3xl">
				There's nothing tracked at this address
			</h1>
			<p className="mb-8 max-w-sm text-pretty text-muted-foreground text-sm">
				The page you asked for doesn't exist. Your tracked time is unaffected.
			</p>
			<div className="flex flex-wrap items-center justify-center gap-3">
				<Button
					render={<Link href="/" />}
					nativeButton={false}
					className="rounded-full px-3 py-2 text-sm"
				>
					Back to the home page
				</Button>
				<Button
					render={<Link href="/dashboard" />}
					nativeButton={false}
					variant="outline"
					className="rounded-full px-3 py-2 text-sm"
				>
					Open your console
				</Button>
			</div>
		</div>
	);
}
