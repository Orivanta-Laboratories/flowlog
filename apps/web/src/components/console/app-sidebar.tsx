"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@flowlog/ui/components/sidebar";
import {
	CalendarCheck,
	FolderTree,
	Laptop,
	MessageSquare,
	SlidersHorizontal,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { UserCard } from "./user-card";

const NAV_GROUPS = [
	{
		label: "Your day",
		items: [
			{
				href: "/dashboard",
				label: "Review",
				description: "Confirm today's blocks",
				icon: CalendarCheck,
			},
			{
				href: "/projects",
				label: "Projects & rules",
				description: "Group and auto-label time",
				icon: FolderTree,
			},
		],
	},
	{
		label: "Organization",
		items: [
			{
				href: "/team",
				label: "Team",
				description: "Members and tracked time",
				icon: Users,
			},
		],
	},
	{
		label: "Setup",
		items: [
			{
				href: "/devices",
				label: "Devices",
				description: "Desktop agent and extension",
				icon: Laptop,
			},
			{
				href: "/settings",
				label: "Settings",
				description: "Hours, exclusions, AI",
				icon: SlidersHorizontal,
			},
			{
				href: "/ai",
				label: "Assistant",
				description: "Ask about your time",
				icon: MessageSquare,
			},
		],
	},
] as const;

export function AppSidebar() {
	const pathname = usePathname();

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader className="h-14 justify-center border-b px-3 group-data-[collapsible=icon]:px-0">
				<Link
					href="/"
					className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:justify-center"
				>
					<span
						aria-hidden="true"
						className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary font-semibold text-[11px] text-primary-foreground"
					>
						FL
					</span>
					<span className="cn-font-heading truncate font-semibold text-sm group-data-[collapsible=icon]:hidden">
						Flowlog
					</span>
				</Link>
			</SidebarHeader>

			<SidebarContent className="gap-0">
				{NAV_GROUPS.map((group) => (
					<SidebarGroup key={group.label}>
						<SidebarGroupLabel>{group.label}</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{group.items.map((item) => {
									const isActive =
										pathname === item.href ||
										pathname.startsWith(`${item.href}/`);
									return (
										<SidebarMenuItem key={item.href}>
											<SidebarMenuButton
												isActive={isActive}
												tooltip={item.label}
												className="h-auto py-2"
												render={
													<Link
														href={item.href}
														aria-current={isActive ? "page" : undefined}
													/>
												}
											>
												<item.icon aria-hidden="true" />
												<span className="flex min-w-0 flex-col">
													<span className="truncate font-medium">
														{item.label}
													</span>
													<span className="truncate text-muted-foreground text-xs group-data-[collapsible=icon]:hidden">
														{item.description}
													</span>
												</span>
											</SidebarMenuButton>
										</SidebarMenuItem>
									);
								})}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
			</SidebarContent>

			<SidebarFooter className="border-t">
				<p className="px-2 pb-1 text-muted-foreground text-xs group-data-[collapsible=icon]:hidden">
					Flowlog suggests. You confirm.
				</p>
				<UserCard />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
