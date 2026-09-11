"use client";

import { INVITATION_STATUS, ORG_ROLE } from "@flowlog/db/constants";
import { Badge } from "@flowlog/ui/components/badge";
import { Button } from "@flowlog/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@flowlog/ui/components/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@flowlog/ui/components/empty";
import { Input } from "@flowlog/ui/components/input";
import { Label } from "@flowlog/ui/components/label";
import { Skeleton } from "@flowlog/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@flowlog/ui/components/table";
import { MailCheck, Users } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { OrgHeatmap } from "@/components/org-heatmap";
import { formatDurationLabel } from "@/helpers/format-time";
import {
	useOrganizationHeatmap,
	useOrganizationTrackedTime,
} from "@/hooks/use-organization";
import { authClient } from "@/lib/auth-client";

const HEATMAP_DAYS = 90;
const TRACKED_TIME_DAYS = 7;

type ActiveOrganization = NonNullable<
	ReturnType<typeof authClient.useActiveOrganization>["data"]
>;

function InviteMemberForm({ onInvited }: { onInvited: () => void }) {
	const [email, setEmail] = React.useState("");
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		setIsSubmitting(true);
		const { error } = await authClient.organization.inviteMember({
			email,
			role: "member",
		});
		setIsSubmitting(false);
		if (error) {
			toast.error(error.message ?? "Could not send invitation.");
			return;
		}
		toast.success(`Invitation sent to ${email}.`);
		setEmail("");
		onInvited();
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Invite a teammate</CardTitle>
				<CardDescription>
					They'll join this organization as a member and see only their own
					tracked time.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					onSubmit={handleSubmit}
					className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
				>
					<div className="grid gap-1.5">
						<Label htmlFor="invite-email">Email address</Label>
						<Input
							id="invite-email"
							type="email"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							placeholder="teammate@example.com"
							required
						/>
					</div>
					<Button type="submit" disabled={isSubmitting} className="w-fit">
						Send invitation
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}

function PendingInvitations({
	invitations,
	onCanceled,
}: {
	invitations: ActiveOrganization["invitations"];
	onCanceled: () => void;
}) {
	const [cancelingId, setCancelingId] = React.useState<string | null>(null);

	const pending = invitations.filter(
		(invitation) => invitation.status === INVITATION_STATUS.PENDING,
	);

	if (pending.length === 0) {
		return null;
	}

	async function handleCancel(invitationId: string) {
		setCancelingId(invitationId);
		const { error } = await authClient.organization.cancelInvitation({
			invitationId,
		});
		setCancelingId(null);
		if (error) {
			toast.error(error.message ?? "Could not cancel invitation.");
			return;
		}
		toast.success("Invitation canceled.");
		onCanceled();
	}

	return (
		<section>
			<h2 className="cn-font-heading mb-3 font-medium text-base">
				Pending invitations
			</h2>
			<ul className="space-y-px overflow-hidden ring-1 ring-border">
				{pending.map((invitation) => (
					<li
						key={invitation.id}
						className="flex flex-wrap items-center gap-3 bg-card px-4 py-3 text-sm"
					>
						<MailCheck
							className="size-4 shrink-0 text-muted-foreground"
							aria-hidden="true"
						/>
						<span className="min-w-0 flex-1 truncate">{invitation.email}</span>
						<Badge variant="outline">Awaiting reply</Badge>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => handleCancel(invitation.id)}
							disabled={cancelingId === invitation.id}
						>
							Cancel
						</Button>
					</li>
				))}
			</ul>
		</section>
	);
}

function MembersTable() {
	const trackedTime = useOrganizationTrackedTime(TRACKED_TIME_DAYS);

	if (trackedTime.isPending) {
		return (
			<Skeleton
				role="status"
				className="h-32 w-full"
				aria-label="Loading members"
			/>
		);
	}

	if (trackedTime.isError) {
		return (
			<p role="alert" className="text-destructive text-sm">
				{trackedTime.error.message}
			</p>
		);
	}

	if (trackedTime.data.length === 0) {
		return (
			<Empty className="ring-1 ring-border">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<Users aria-hidden="true" />
					</EmptyMedia>
					<EmptyTitle>No members yet</EmptyTitle>
					<EmptyDescription>
						Invite a teammate above and they'll appear here once they accept.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<div className="overflow-hidden ring-1 ring-border">
			<Table>
				<TableHeader>
					<TableRow className="bg-muted/50">
						<TableHead className="px-4">Name</TableHead>
						<TableHead>Role</TableHead>
						<TableHead className="text-right">
							Confirmed, last {TRACKED_TIME_DAYS} days
						</TableHead>
						<TableHead className="px-4 text-right">Joined</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{trackedTime.data.map((member) => (
						<TableRow key={member.memberId}>
							<TableCell className="px-4">
								<p className="font-medium">{member.name}</p>
								<p className="text-muted-foreground">{member.email}</p>
							</TableCell>
							<TableCell>
								<Badge
									variant={
										member.role === ORG_ROLE.OWNER ? "default" : "outline"
									}
								>
									{member.role === ORG_ROLE.OWNER ? "Owner" : "Member"}
								</Badge>
							</TableCell>
							<TableCell className="text-right tabular-nums">
								{formatDurationLabel(member.trackedSeconds)}
							</TableCell>
							<TableCell className="px-4 text-right text-muted-foreground tabular-nums">
								{new Date(member.joinedAt).toLocaleDateString(undefined, {
									month: "short",
									day: "numeric",
									year: "numeric",
								})}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

function OrgHeatmapSection() {
	const heatmap = useOrganizationHeatmap(HEATMAP_DAYS);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Tracked time across the organization</CardTitle>
				<CardDescription>
					One square per day over the last {HEATMAP_DAYS} days, summed across
					everyone.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{heatmap.isPending && (
					<Skeleton
						role="status"
						className="h-24 w-full"
						aria-label="Loading activity"
					/>
				)}
				{heatmap.isError && (
					<p role="alert" className="text-destructive text-sm">
						{heatmap.error.message}
					</p>
				)}
				{heatmap.isSuccess && (
					<OrgHeatmap data={heatmap.data} days={HEATMAP_DAYS} />
				)}
			</CardContent>
		</Card>
	);
}

function OwnerTeamView({
	organization,
	refetchOrganization,
}: {
	organization: ActiveOrganization;
	refetchOrganization: () => void;
}) {
	return (
		<div className="grid gap-8">
			<InviteMemberForm onInvited={refetchOrganization} />
			<PendingInvitations
				invitations={organization.invitations}
				onCanceled={refetchOrganization}
			/>
			<section>
				<h2 className="cn-font-heading mb-3 font-medium text-base">Members</h2>
				<MembersTable />
			</section>
			<OrgHeatmapSection />
		</div>
	);
}

function MemberTeamView({
	organizationName,
	memberCount,
}: {
	organizationName: string;
	memberCount: number;
}) {
	const otherMembers = Math.max(memberCount - 1, 0);
	return (
		<Empty className="ring-1 ring-border">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<Users aria-hidden="true" />
				</EmptyMedia>
				<EmptyTitle>You're part of {organizationName}</EmptyTitle>
				<EmptyDescription>
					{otherMembers === 0
						? "You're the only member so far. Your owner can invite more people."
						: `Along with ${otherMembers} other ${otherMembers === 1 ? "person" : "people"}. Only the owner can see everyone's tracked time.`}
				</EmptyDescription>
			</EmptyHeader>
		</Empty>
	);
}

export default function TeamPageClient() {
	const [mounted, setMounted] = React.useState(false);
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const {
		data: activeOrganization,
		isPending: organizationPending,
		refetch: refetchOrganization,
	} = authClient.useActiveOrganization();

	React.useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted || sessionPending || organizationPending) {
		return (
			<div
				className="space-y-3"
				role="status"
				aria-busy="true"
				aria-label="Loading your team"
			>
				<Skeleton className="h-28 w-full" />
				<Skeleton className="h-32 w-full" />
				<Skeleton className="h-24 w-full" />
			</div>
		);
	}

	if (!session?.user || !activeOrganization) {
		return (
			<Empty className="ring-1 ring-border">
				<EmptyHeader>
					<EmptyTitle>No organization found</EmptyTitle>
					<EmptyDescription>
						Something went wrong loading your organization. Try refreshing the
						page.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	const membership = activeOrganization.members.find(
		(member) => member.userId === session.user.id,
	);
	const role = membership?.role ?? ORG_ROLE.MEMBER;

	if (role === ORG_ROLE.OWNER) {
		return (
			<OwnerTeamView
				organization={activeOrganization}
				refetchOrganization={refetchOrganization}
			/>
		);
	}

	return (
		<MemberTeamView
			organizationName={activeOrganization.name}
			memberCount={activeOrganization.members.length}
		/>
	);
}
