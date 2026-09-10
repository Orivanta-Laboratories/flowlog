"use client";

import { AI_SUGGESTION_BATCH_CAP } from "@flowlog/db/constants";
import { Badge } from "@flowlog/ui/components/badge";
import { Button } from "@flowlog/ui/components/button";
import { Checkbox } from "@flowlog/ui/components/checkbox";
import {
	Empty,
	EmptyDescription,
	EmptyTitle,
} from "@flowlog/ui/components/empty";
import { Input } from "@flowlog/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@flowlog/ui/components/select";
import { Skeleton } from "@flowlog/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@flowlog/ui/components/table";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
	addDaysToDateInputValue,
	formatClockTime,
	formatDurationLabel,
	toDateInputValue,
} from "@/helpers/format-time";
import {
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
	const effectiveDrafts = withMissingDrafts(drafts, rows);
	if (effectiveDrafts !== drafts) {
		setDrafts(effectiveDrafts);
	}

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
			{ onError: (error) => toast.error(error.message) },
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
			{ onError: (error) => toast.error(error.message) },
		);
	}

	return (
		<div className="mx-auto max-w-5xl px-4 py-6">
			<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setDate((d) => addDaysToDateInputValue(d, -1))}
						aria-label="Previous day"
					>
						←
					</Button>
					<Input
						type="date"
						value={date}
						onChange={(e) => setDate(e.target.value)}
						className="w-40"
					/>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setDate((d) => addDaysToDateInputValue(d, 1))}
						aria-label="Next day"
					>
						→
					</Button>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={requestAiForPending}
						disabled={requestAi.isPending}
					>
						Suggest with AI
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={mergeSelected}
						disabled={mergeSessions.isPending || selectedIds.size < 2}
					>
						Merge selected
					</Button>
					<Button
						size="sm"
						onClick={acceptAllHighConfidence}
						disabled={confirmSessions.isPending}
					>
						Accept all high-confidence
					</Button>
				</div>
			</div>

			{sessions.isPending && <Skeleton className="h-64 w-full" />}

			{sessions.isError && (
				<p className="text-destructive text-sm">{sessions.error.message}</p>
			)}

			{sessions.isSuccess && rows.length === 0 && (
				<Empty>
					<EmptyTitle>Nothing tracked yet for this day</EmptyTitle>
					<EmptyDescription>
						Pair a device from Settings → Devices and Flowlog will fill this in
						automatically.
					</EmptyDescription>
				</Empty>
			)}

			{sessions.isSuccess && rows.length > 0 && (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-8" />
							<TableHead>Time</TableHead>
							<TableHead>Context</TableHead>
							<TableHead>Label</TableHead>
							<TableHead>Project</TableHead>
							<TableHead>Confidence</TableHead>
							<TableHead className="w-20" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.map((row) => {
							const draft = effectiveDrafts[row.id] ?? draftFromSession(row);
							const confirmed = row.status === "CONFIRMED";
							return (
								<TableRow key={row.id}>
									<TableCell>
										<Checkbox
											checked={selectedIds.has(row.id)}
											onCheckedChange={(checked) =>
												toggleSelected(row.id, checked === true)
											}
											aria-label="Select block"
										/>
									</TableCell>
									<TableCell>
										{formatClockTime(row.startedAt)}–
										{formatClockTime(row.endedAt)}
										<div className="text-muted-foreground">
											{formatDurationLabel(row.durationSeconds)}
										</div>
									</TableCell>
									<TableCell
										className="max-w-48 truncate"
										title={describeSessionContext(row)}
									>
										{describeSessionContext(row)}
									</TableCell>
									<TableCell>
										<Input
											value={draft.finalLabel}
											onChange={(e) =>
												updateDraft(row.id, { finalLabel: e.target.value })
											}
											disabled={confirmed}
											className="h-8 w-40"
										/>
									</TableCell>
									<TableCell>
										<Select
											value={draft.projectId ?? UNASSIGNED_PROJECT_VALUE}
											onValueChange={(value) =>
												updateDraft(row.id, {
													projectId:
														value === UNASSIGNED_PROJECT_VALUE ? null : value,
												})
											}
											disabled={confirmed}
										>
											<SelectTrigger size="sm" className="w-36">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value={UNASSIGNED_PROJECT_VALUE}>
													No project
												</SelectItem>
												{(projects.data ?? []).map((project) => (
													<SelectItem key={project.id} value={project.id}>
														{project.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</TableCell>
									<TableCell>
										<Badge
											variant={confirmed ? "secondary" : "outline"}
											title={describeSuggestionSource(row.suggestionSource)}
										>
											{confirmed ? "confirmed" : `${row.confidencePercent}%`}
										</Badge>
									</TableCell>
									<TableCell>
										{!confirmed && (
											<Button
												size="sm"
												variant="ghost"
												onClick={() => confirmOne(row.id)}
											>
												Confirm
											</Button>
										)}
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			)}
		</div>
	);
}
