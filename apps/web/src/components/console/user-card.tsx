"use client";

import { ORG_ROLE } from "@flowlog/db/constants";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@flowlog/ui/components/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@flowlog/ui/components/sidebar";
import { Skeleton } from "@flowlog/ui/components/skeleton";
import {
	ChevronsUpDown,
	LogOut,
	MonitorSmartphone,
	Moon,
	SlidersHorizontal,
	Sun,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import * as React from "react";

import { authClient } from "@/lib/auth-client";

function initials(name: string): string {
	const parts = name.trim().split(/\s+/).slice(0, 2);
	const letters = parts.map((part) => part.charAt(0)).join("");
	return letters === "" ? "?" : letters.toUpperCase();
}

export function UserCard() {
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();
	const { data: organization } = authClient.useActiveOrganization();
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = React.useState(false);

	React.useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted || isPending) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<Skeleton className="h-10 w-full" />
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	if (!session) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton tooltip="Sign in" render={<Link href="/login" />}>
						<LogOut aria-hidden="true" />
						<span>Sign in</span>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	const isDark = resolvedTheme === "dark";
	const membership = organization?.members.find(
		(member) => member.userId === session.user.id,
	);
	const subtitle =
		organization === undefined ||
		organization === null ||
		membership === undefined
			? session.user.email
			: `${membership.role === ORG_ROLE.OWNER ? "Owner" : "Member"} · ${organization.name}`;

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={<SidebarMenuButton size="lg" className="h-auto py-2" />}
					>
						<span
							aria-hidden="true"
							className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent font-medium text-[11px] text-accent-foreground"
						>
							{initials(session.user.name)}
						</span>
						<span className="flex min-w-0 flex-col text-left">
							<span className="truncate font-medium">{session.user.name}</span>
							<span className="truncate text-muted-foreground text-xs">
								{subtitle}
							</span>
						</span>
						<ChevronsUpDown className="ml-auto" aria-hidden="true" />
					</DropdownMenuTrigger>
					<DropdownMenuContent
						side="top"
						align="start"
						className="w-60 bg-popover"
					>
						<DropdownMenuLabel className="font-normal text-muted-foreground">
							{session.user.email}
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem render={<Link href="/settings" />}>
								<SlidersHorizontal aria-hidden="true" />
								Settings
							</DropdownMenuItem>
							<DropdownMenuItem render={<Link href="/devices" />}>
								<MonitorSmartphone aria-hidden="true" />
								Devices
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => setTheme(isDark ? "light" : "dark")}
							>
								{isDark ? (
									<Sun aria-hidden="true" />
								) : (
									<Moon aria-hidden="true" />
								)}
								{isDark ? "Light theme" : "Dark theme"}
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							variant="destructive"
							onClick={() => {
								authClient.signOut({
									fetchOptions: { onSuccess: () => router.push("/") },
								});
							}}
						>
							<LogOut aria-hidden="true" />
							Sign out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
