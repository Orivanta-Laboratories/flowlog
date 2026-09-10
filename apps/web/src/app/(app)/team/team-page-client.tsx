"use client";

import { INVITATION_STATUS, ORG_ROLE } from "@flowlog/db/constants";
import { Badge } from "@flowlog/ui/components/badge";
import { Button } from "@flowlog/ui/components/button";
import {
	Empty,
	EmptyDescription,
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
		<form
			onSubmit={handleSubmit}
			className="mb-8 grid gap-3 rounded-md border p-4 sm:grid-cols-[1fr_auto] sm:items-end"
		>
			<div>
				<Label htmlFor="invite-email">Invite a teammate</Label>
				<Input
					id="invite-email"
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="teammate@example.com"
					required
				/>
			</div>
			<Button type="submit" disabled={isSubmitting} className="w-fit">
				Send invitation
			</Button>
		</form>
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
		<div className="mb-8">
			<h2 className="mb-2 font-medium text-base">Pending invitations</h2>
			<ul className="divide-y rounded-md border">
				{pending.map((invitation) => (
					<li
						key={invitation.id}
						className="flex items-center justify-between px-4 py-2 text-sm"
					>
						<span>{invitation.email}</span>
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
		</div>
	);
}

function MembersTable() {
	const trackedTime = useOrganizationTrackedTime(TRACKED_TIME_DAYS);

	if (trackedTime.isPending) {
		return <Skeleton className="h-32 w-full" />;
	}

	if (trackedTime.isError) {
		return (
			<p className="text-destructive text-sm">{trackedTime.error.message}</p>
		);
	}

	if (trackedTime.data.length === 0) {
		return (
			<Empty className="mb-8">
				<EmptyTitle>No members yet</EmptyTitle>
				<EmptyDescription>
					Invite a teammate above to get started.
				</EmptyDescription>
			</Empty>
		);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>Email</TableHead>
					<TableHead>Role</TableHead>
					<TableHead>Tracked ({TRACKED_TIME_DAYS}d)</TableHead>
					<TableHead>Joined</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{trackedTime.data.map((member) => (
					<TableRow key={member.memberId}>
						<TableCell className="font-medium">{member.name}</TableCell>
						<TableCell className="text-muted-foreground">
							{member.email}
						</TableCell>
						<TableCell>
							<Badge
								variant={member.role === ORG_ROLE.OWNER ? "default" : "outline"}
							>
								{member.role}
							</Badge>
						</TableCell>
						<TableCell>{formatDurationLabel(member.trackedSeconds)}</TableCell>
						<TableCell className="text-muted-foreground">
							{new Date(member.joinedAt).toLocaleDateString()}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

function OrgHeatmapSection() {
	const heatmap = useOrganizationHeatmap(HEATMAP_DAYS);

	return (
		<div className="mb-8">
			<h2 className="mb-1 font-medium text-base">Activity</h2>
			<p className="mb-4 text-muted-foreground text-sm">
				Org-wide tracked time over the last {HEATMAP_DAYS} days.
			</p>
			{heatmap.isPending && <Skeleton className="h-24 w-full" />}
			{heatmap.isError && (
				<p className="text-destructive text-sm">{heatmap.error.message}</p>
			)}
			{heatmap.isSuccess && (
				<OrgHeatmap data={heatmap.data} days={HEATMAP_DAYS} />
			)}
		</div>
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
		<>
			<InviteMemberForm onInvited={refetchOrganization} />
			<PendingInvitations
				invitations={organization.invitations}
				onCanceled={refetchOrganization}
			/>
			<h2 className="mb-2 font-medium text-base">Members</h2>
			<div className="mb-8">
				<MembersTable />
			</div>
			<OrgHeatmapSection />
		</>
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
		<Empty>
			<EmptyTitle>You're part of {organizationName}</EmptyTitle>
			<EmptyDescription>
				{otherMembers === 0
					? "You're the only member so far."
					: `Along with ${otherMembers} other ${otherMembers === 1 ? "person" : "people"}.`}
			</EmptyDescription>
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
			<div className="space-y-3">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-32 w-full" />
				<Skeleton className="h-24 w-full" />
			</div>
		);
	}

	if (!session?.user || !activeOrganization) {
		return (
			<Empty>
				<EmptyTitle>No organization found</EmptyTitle>
				<EmptyDescription>
					Something went wrong loading your organization. Try refreshing the
					page.
				</EmptyDescription>
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
