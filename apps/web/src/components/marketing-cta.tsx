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
				className="h-10 w-48 animate-pulse rounded-full bg-muted"
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
					"rounded-full px-3 py-2 text-base transition-all duration-700 ease-fluid",
					inverted && "bg-background text-foreground hover:bg-background/90",
				)}
			>
				Open your console
				<ArrowRight data-icon="inline-end" aria-hidden="true" />
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
					"rounded-full px-3 py-2 text-base transition-all duration-700 ease-fluid",
					inverted && "bg-background text-foreground hover:bg-background/90",
				)}
			>
				Create your account
				<ArrowRight data-icon="inline-end" aria-hidden="true" />
			</Button>
			<Button
				render={<Link href="/login" />}
				nativeButton={false}
				variant="outline"
				size="lg"
				className={cn(
					"rounded-full px-3 py-2 text-base transition-all duration-700 ease-fluid",
					inverted &&
						"border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10",
				)}
			>
				Sign in
			</Button>
		</>
	);
}
