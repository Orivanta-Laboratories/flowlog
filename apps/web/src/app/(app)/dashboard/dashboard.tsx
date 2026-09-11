"use client";

import {
	AI_SUGGESTION_BATCH_CAP,
	type ProjectColor,
} from "@flowlog/db/constants";
import { Badge } from "@flowlog/ui/components/badge";
import { Button } from "@flowlog/ui/components/button";
import { Checkbox } from "@flowlog/ui/components/checkbox";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@flowlog/ui/components/empty";
import { Input } from "@flowlog/ui/components/input";
import { Label } from "@flowlog/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@flowlog/ui/components/select";
import { Separator } from "@flowlog/ui/components/separator";
import { Skeleton } from "@flowlog/ui/components/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@flowlog/ui/components/tooltip";
import { cn } from "@flowlog/ui/lib/utils";
import {
	CalendarX2,
	Check,
	Combine,
	Sparkles,
	TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DayPicker } from "@/components/console/day-picker";
import {
	formatClockTime,
	formatDurationLabel,
	toDateInputValue,
} from "@/helpers/format-time";
import {
	projectColorSwatchClass,
	suggestionSourceName,
} from "@/helpers/readable-names";
import {
	type ActivitySessionRow,
	describeSessionContext,
	describeSuggestionSource,
	isHighConfidenceSession,
} from "@/helpers/session-context";
import {
	draftFromSession,
	type SessionDraftMap,
	withMissingDrafts,
} from "@/helpers/session-drafts";
import {
	useActivitySessions,
	useConfirmActivitySessions,
	useMergeActivitySessions,
	useRequestAiSuggestions,
} from "@/hooks/use-activity-sessions";
import { useProjectList } from "@/hooks/use-projects";
import type { authClient } from "@/lib/auth-client";

const UNASSIGNED_PROJECT_VALUE = "none";

function DaySummary({ rows }: { rows: ActivitySessionRow[] }) {
	const trackedSeconds = rows.reduce(
		(total, row) => total + row.durationSeconds,
		0,
	);
	const confirmed = rows.filter((row) => row.status === "CONFIRMED");
	const confirmedSeconds = confirmed.reduce(
		(total, row) => total + row.durationSeconds,
		0,
	);
	const awaiting = rows.length - confirmed.length;

	const stats = [
		{ label: "Tracked", value: formatDurationLabel(trackedSeconds) },
		{ label: "Confirmed", value: formatDurationLabel(confirmedSeconds) },
		{
			label: "Awaiting review",
			value: `${awaiting} block${awaiting === 1 ? "" : "s"}`,
		},
	];

	return (
		<dl className="mb-4 grid grid-cols-1 gap-px overflow-hidden bg-border ring-1 ring-border sm:grid-cols-3">
			{stats.map((stat) => (
				<div key={stat.label} className="bg-card px-4 py-3">
					<dt className="text-muted-foreground text-xs">{stat.label}</dt>
					<dd className="cn-font-heading mt-0.5 font-semibold text-lg tabular-nums">
						{stat.value}
					</dd>
				</div>
			))}
		</dl>
	);
}

function ConfidenceBadge({ row }: { row: ActivitySessionRow }) {
	if (row.status === "CONFIRMED") {
		return (
			<Badge variant="secondary" className="gap-1">
				<Check aria-hidden="true" />
				Confirmed
			</Badge>
		);
	}

	const isLow = row.confidencePercent < 50;

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<Badge
						variant={isLow ? "destructive" : "outline"}
						className="gap-1 tabular-nums"
					/>
				}
			>
				{isLow && <TriangleAlert aria-hidden="true" />}
				{suggestionSourceName(row.suggestionSource)} · {row.confidencePercent}%
			</TooltipTrigger>
			<TooltipContent>
				Suggested from {describeSuggestionSource(row.suggestionSource)}. A
				tracked block records where your attention was, not that the task is
				finished.
			</TooltipContent>
		</Tooltip>
	);
}

function ReviewRow({
	row,
	projects,
	draft,
	selected,
	onSelect,
	onDraftChange,
	onConfirm,
	isConfirming,
}: {
	row: ActivitySessionRow;
	projects: Array<{ id: string; name: string; color: ProjectColor }>;
	draft: { finalLabel: string; projectId: string | null };
	selected: boolean;
	onSelect: (checked: boolean) => void;
	onDraftChange: (
		patch: Partial<{ finalLabel: string; projectId: string | null }>,
	) => void;
	onConfirm: () => void;
	isConfirming: boolean;
}) {
	const confirmed = row.status === "CONFIRMED";
	const context = describeSessionContext(row);
	const labelId = `label-${row.id}`;
	const projectId = `project-${row.id}`;
	const activeProject = projects.find(
		(project) => project.id === draft.projectId,
	);

	return (
		<li
			className={cn(
				"grid gap-3 bg-card px-4 py-3 transition-colors duration-200 ease-fluid",
				"sm:grid-cols-[auto_10rem_1fr] sm:items-start",
				selected && "bg-accent/40",
				confirmed && "bg-muted/40",
			)}
		>
			<div className="flex items-center gap-3 sm:pt-1.5">
				<Checkbox
					checked={selected}
					onCheckedChange={(checked) => onSelect(checked === true)}
					aria-label={`Select the block from ${formatClockTime(row.startedAt)}`}
					disabled={confirmed}
				/>
				<span className="text-muted-foreground text-xs sm:hidden">
					{formatClockTime(row.startedAt)}–{formatClockTime(row.endedAt)}
				</span>
			</div>

			<div className="hidden sm:block sm:pt-0.5">
				<p className="font-medium text-sm tabular-nums">
					{formatClockTime(row.startedAt)}–{formatClockTime(row.endedAt)}
				</p>
				<p className="text-muted-foreground text-xs tabular-nums">
					{formatDurationLabel(row.durationSeconds)}
				</p>
			</div>

			<div className="min-w-0">
				<div className="mb-2 flex flex-wrap items-center gap-2">
					<p
						className="min-w-0 truncate font-mono text-muted-foreground text-xs"
						title={context}
					>
						{context}
					</p>
					<ConfidenceBadge row={row} />
				</div>

				<div className="grid gap-2 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
					<div>
						<Label htmlFor={labelId} className="sr-only">
							What this time was for
						</Label>
						<Input
							id={labelId}
							value={draft.finalLabel}
							placeholder="What was this time for?"
							onChange={(event) =>
								onDraftChange({ finalLabel: event.target.value })
							}
							disabled={confirmed}
						/>
					</div>

					<div>
						<Label htmlFor={projectId} className="sr-only">
							Project
						</Label>
						<Select
							value={draft.projectId ?? UNASSIGNED_PROJECT_VALUE}
							onValueChange={(value) =>
								onDraftChange({
									projectId: value === UNASSIGNED_PROJECT_VALUE ? null : value,
								})
							}
							disabled={confirmed}
						>
							<SelectTrigger id={projectId} className="w-full">
								<SelectValue>
									<span className="flex min-w-0 items-center gap-2">
										{activeProject !== undefined && (
											<span
												aria-hidden="true"
												className={cn(
													"size-2 shrink-0 rounded-full",
													projectColorSwatchClass(activeProject.color),
												)}
											/>
										)}
										<span className="truncate">
											{activeProject?.name ?? "No project"}
										</span>
									</span>
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={UNASSIGNED_PROJECT_VALUE}>
									No project
								</SelectItem>
								{projects.map((project) => (
									<SelectItem key={project.id} value={project.id}>
										<span className="flex items-center gap-2">
											<span
												aria-hidden="true"
												className={cn(
													"size-2 shrink-0 rounded-full",
													projectColorSwatchClass(project.color),
												)}
											/>
											{project.name}
										</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{confirmed ? (
						<p className="text-muted-foreground text-xs sm:pb-2">
							You confirmed this
						</p>
					) : (
						<Button onClick={onConfirm} disabled={isConfirming}>
							Confirm
						</Button>
					)}
				</div>
			</div>
		</li>
	);
}

export default function Dashboard({
	session: _session,
}: {
	session: typeof authClient.$Infer.Session;
}) {
	const [date, setDate] = useState(() => toDateInputValue(new Date()));
	const timezoneOffsetMinutes = useMemo(
		() => new Date().getTimezoneOffset(),
		[],
	);

	const sessions = useActivitySessions(date, timezoneOffsetMinutes);
	const projects = useProjectList();
	const confirmSessions = useConfirmActivitySessions();
	const mergeSessions = useMergeActivitySessions();
	const requestAi = useRequestAiSuggestions();

	const [drafts, setDrafts] = useState<SessionDraftMap>({});
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	const rows = sessions.data ?? [];
	const projectOptions = projects.data ?? [];
	const effectiveDrafts = withMissingDrafts(drafts, rows);
	if (effectiveDrafts !== drafts) {
		setDrafts(effectiveDrafts);
	}

	const highConfidenceCount = rows.filter((row) =>
		isHighConfidenceSession(row),
	).length;
	const unlabeledCount = rows.filter(
		(row) => row.status !== "CONFIRMED" && row.suggestionSource === "NONE",
	).length;

	function updateDraft(
		id: string,
		patch: Partial<{ finalLabel: string; projectId: string | null }>,
	) {
		setDrafts((current) => ({
			...current,
			[id]: {
				...(current[id] ?? { finalLabel: "", projectId: null }),
				...patch,
			},
		}));
	}

	function toggleSelected(id: string, checked: boolean) {
		setSelectedIds((current) => {
			const next = new Set(current);
			if (checked) {
				next.add(id);
			} else {
				next.delete(id);
			}
			return next;
		});
	}

	function confirmOne(id: string) {
		const draft = effectiveDrafts[id];
		if (draft === undefined || draft.finalLabel.trim() === "") {
			toast.error("Give this block a label before confirming.");
			return;
		}
		confirmSessions.mutate(
			{
				entries: [
					{
						id,
						finalLabel: draft.finalLabel.trim(),
						projectId: draft.projectId,
					},
				],
			},
			{
				onSuccess: () => toast.success("Block confirmed."),
				onError: (error) => toast.error(error.message),
			},
		);
	}

	function acceptAllHighConfidence() {
		const entries = rows
			.filter((row) => isHighConfidenceSession(row))
			.map((row) => {
				const draft = effectiveDrafts[row.id] ?? draftFromSession(row);
				return {
					id: row.id,
					finalLabel: draft.finalLabel.trim(),
					projectId: draft.projectId,
				};
			})
			.filter((entry) => entry.finalLabel !== "");

		if (entries.length === 0) {
			toast.info("No high-confidence blocks to accept.");
			return;
		}
		confirmSessions.mutate(
			{ entries },
			{
				onSuccess: () =>
					toast.success(
						`Accepted ${entries.length} block${entries.length === 1 ? "" : "s"}.`,
					),
				onError: (error) => toast.error(error.message),
			},
		);
	}

	function mergeSelected() {
		if (selectedIds.size < 2) {
			toast.error("Select at least two adjacent blocks to merge.");
			return;
		}
		mergeSessions.mutate(
			{ sessionIds: [...selectedIds] },
			{
				onSuccess: () => {
					setSelectedIds(new Set());
					toast.success("Blocks merged.");
				},
				onError: (error) => toast.error(error.message),
			},
		);
	}

	function requestAiForPending() {
		const pendingIds = rows
			.filter(
				(row) => row.status !== "CONFIRMED" && row.suggestionSource === "NONE",
			)
			.slice(0, AI_SUGGESTION_BATCH_CAP)
			.map((row) => row.id);
		if (pendingIds.length === 0) {
			toast.info("Nothing left unlabeled.");
			return;
		}
		requestAi.mutate(
			{ sessionIds: pendingIds },
			{
				onSuccess: () => toast.success("Asked for suggestions."),
				onError: (error) => toast.error(error.message),
			},
		);
	}

	return (
		<>
			<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
				<DayPicker value={date} onChange={setDate} />
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						onClick={requestAiForPending}
						disabled={requestAi.isPending || unlabeledCount === 0}
					>
						<Sparkles data-icon="inline-start" aria-hidden="true" />
						Suggest {unlabeledCount > 0 ? `${unlabeledCount} ` : ""}unlabeled
					</Button>
					<Button
						onClick={acceptAllHighConfidence}
						disabled={confirmSessions.isPending || highConfidenceCount === 0}
					>
						<Check data-icon="inline-start" aria-hidden="true" />
						Accept {highConfidenceCount > 0 ? highConfidenceCount : ""}{" "}
						confident
					</Button>
				</div>
			</div>

			{sessions.isPending && (
				<div
					className="space-y-px"
					role="status"
					aria-busy="true"
					aria-label="Loading your day"
				>
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-24 w-full" />
					<Skeleton className="h-24 w-full" />
				</div>
			)}

			{sessions.isError && (
				<p role="alert" className="text-destructive text-sm">
					{sessions.error.message}
				</p>
			)}

			{sessions.isSuccess && rows.length === 0 && (
				<Empty className="ring-1 ring-border">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<CalendarX2 aria-hidden="true" />
						</EmptyMedia>
						<EmptyTitle>Nothing tracked on this day</EmptyTitle>
						<EmptyDescription>
							Connect the desktop agent or the browser extension from Devices,
							and your next workday shows up here on its own.
						</EmptyDescription>
					</EmptyHeader>
					<Button render={<Link href="/devices" />} nativeButton={false}>
						Go to Devices
					</Button>
				</Empty>
			)}

			{sessions.isSuccess && rows.length > 0 && (
				<>
					<DaySummary rows={rows} />

					{selectedIds.size > 0 && (
						<div
							role="status"
							className="mb-2 flex flex-wrap items-center gap-3 bg-accent px-4 py-2 text-accent-foreground text-sm"
						>
							<span className="font-medium">{selectedIds.size} selected</span>
							<Separator orientation="vertical" className="h-4" />
							<Button
								variant="ghost"
								size="sm"
								onClick={mergeSelected}
								disabled={mergeSessions.isPending || selectedIds.size < 2}
							>
								<Combine data-icon="inline-start" aria-hidden="true" />
								Merge into one block
							</Button>
							<Button
								variant="ghost"
								size="sm"
								className="ml-auto"
								onClick={() => setSelectedIds(new Set())}
							>
								Clear
							</Button>
						</div>
					)}

					<ul className="space-y-px overflow-hidden ring-1 ring-border">
						{rows.map((row) => (
							<ReviewRow
								key={row.id}
								row={row}
								projects={projectOptions}
								draft={effectiveDrafts[row.id] ?? draftFromSession(row)}
								selected={selectedIds.has(row.id)}
								onSelect={(checked) => toggleSelected(row.id, checked)}
								onDraftChange={(patch) => updateDraft(row.id, patch)}
								onConfirm={() => confirmOne(row.id)}
								isConfirming={confirmSessions.isPending}
							/>
						))}
					</ul>

					<p className="mt-3 text-muted-foreground text-xs">
						Flowlog records where your attention was. It can't tell whether a
						task finished, so nothing counts until you confirm it.
					</p>
				</>
			)}
		</>
	);
}
