"use client";

import { cn } from "@flowlog/ui/lib/utils";
import * as React from "react";

export function Reveal({
	children,
	className,
	delayMs = 0,
}: {
	children: React.ReactNode;
	className?: string;
	delayMs?: number;
}) {
	const ref = React.useRef<HTMLDivElement>(null);
	const [shown, setShown] = React.useState(false);

	React.useEffect(() => {
		const node = ref.current;
		if (node === null) {
			return;
		}
		if (
			window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
			typeof IntersectionObserver === "undefined"
		) {
			setShown(true);
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						setShown(true);
						observer.disconnect();
					}
				}
			},
			{ rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
		);
		observer.observe(node);
		return () => observer.disconnect();
	}, []);

	return (
		<div
			ref={ref}
			style={{ transitionDelay: `${delayMs}ms` }}
			className={cn(
				"transition-all duration-700 ease-fluid motion-reduce:transition-none",
				shown
					? "translate-y-0 opacity-100 blur-none"
					: "translate-y-16 opacity-0 blur-md",
				className,
			)}
		>
			{children}
		</div>
	);
}
