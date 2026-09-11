"use client";

import { cn } from "@flowlog/ui/lib/utils";
import * as React from "react";

const TAGLINE =
	"You already did the work. Flowlog just remembers what you had open, in what order, for how long.";

export function TaglineReveal() {
	const containerRef = React.useRef<HTMLParagraphElement>(null);
	const words = React.useMemo(() => TAGLINE.split(" "), []);
	const [activeCount, setActiveCount] = React.useState(0);

	React.useEffect(() => {
		const container = containerRef.current;
		if (container === null) {
			return;
		}
		if (
			window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
			typeof IntersectionObserver === "undefined"
		) {
			setActiveCount(words.length);
			return;
		}

		const nodes = Array.from(
			container.querySelectorAll<HTMLElement>("[data-word-index]"),
		);
		const activated = new Set<number>();

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) {
						continue;
					}
					const index = Number(
						(entry.target as HTMLElement).dataset.wordIndex ?? "0",
					);
					activated.add(index);
					observer.unobserve(entry.target);
				}
				if (activated.size > 0) {
					setActiveCount((current) =>
						Math.max(current, Math.max(...activated) + 1),
					);
				}
			},
			{ rootMargin: "0px 0px -45% 0px", threshold: 0 },
		);

		for (const node of nodes) {
			observer.observe(node);
		}
		return () => observer.disconnect();
	}, [words.length]);

	return (
		<p
			ref={containerRef}
			className="cn-font-heading mx-auto max-w-[680px] text-balance font-semibold text-3xl sm:text-4xl lg:text-5xl"
		>
			{words.map((word, index) => (
				<React.Fragment key={`${word}-${index}`}>
					<span
						data-word-index={index}
						style={{ transitionDelay: `${(index % 6) * 40}ms` }}
						className={cn(
							"inline-block transition-colors duration-700 ease-fluid motion-reduce:transition-none",
							index < activeCount ? "text-foreground" : "text-foreground/30",
						)}
					>
						{word}
					</span>
					{index < words.length - 1 && " "}
				</React.Fragment>
			))}
		</p>
	);
}
