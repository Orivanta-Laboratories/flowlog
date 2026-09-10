"use client";

import { Button } from "@flowlog/ui/components/button";
import { cn } from "@flowlog/ui/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { authClient } from "@/lib/auth-client";

export function MarketingCta({ inverted = false }: { inverted?: boolean }) {
	const { data: session, isPending } = authClient.useSession();
	const [mounted, setMounted] = React.useState(false);

	React.useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted || isPending) {
		return (
			<div
				className="h-11 w-44 animate-pulse rounded-full bg-muted"
				aria-hidden="true"
			/>
		);
	}

	if (session) {
		return (
			<Button
				render={<Link href="/dashboard" />}
				nativeButton={false}
				size="lg"
				className={cn(
					"rounded-full",
					inverted && "bg-background text-foreground hover:bg-background/90",
				)}
			>
				Open dashboard
				<ArrowRight data-icon="inline-end" />
			</Button>
		);
	}

	return (
		<>
			<Button
				render={<Link href="/login" />}
				nativeButton={false}
				size="lg"
				className={cn(
					"rounded-full",
					inverted && "bg-background text-foreground hover:bg-background/90",
				)}
			>
				Get started
				<ArrowRight data-icon="inline-end" />
			</Button>
			<Button
				render={<Link href="/login" />}
				nativeButton={false}
				variant="outline"
				size="lg"
				className={cn(
					"rounded-full",
					inverted &&
						"border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10",
				)}
			>
				Sign in
			</Button>
		</>
	);
}
