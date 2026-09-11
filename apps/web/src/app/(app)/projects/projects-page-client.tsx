"use client";

import {
	PROJECT_COLOR_VALUES,
	RULE_FIELD_VALUES,
	RULE_OPERATOR_VALUES,
} from "@flowlog/db/constants";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@flowlog/ui/components/select";
import { Skeleton } from "@flowlog/ui/components/skeleton";
import { cn } from "@flowlog/ui/lib/utils";
import { FolderTree, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
	centsToDollarsLabel,
	dollarsInputToCents,
} from "@/helpers/format-currency";
import {
	projectColorName,
	projectColorSwatchClass,
	ruleFieldName,
	ruleOperatorName,
} from "@/helpers/readable-names";
import {
	useArchiveMatchingRule,
	useArchiveProject,
	useCreateMatchingRule,
	useCreateProject,
	useMatchingRuleList,
	useProjectList,
} from "@/hooks/use-projects";

function CreateProjectForm() {
	const [name, setName] = useState("");
	const [clientName, setClientName] = useState("");
	const [color, setColor] = useState<(typeof PROJECT_COLOR_VALUES)[number]>(
		PROJECT_COLOR_VALUES[0],
	);
	const [rate, setRate] = useState("");
	const createProject = useCreateProject();

	function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		createProject.mutate(
			{
				name,
				clientName: clientName.trim() === "" ? null : clientName.trim(),
				color,
				billingRateCents: dollarsInputToCents(rate),
			},
			{
				onSuccess: () => {
					setName("");
					setClientName("");
					setRate("");
					toast.success(`Project "${name}" created.`);
				},
				onError: (error) => toast.error(error.message),
			},
		);
	}

	return (
		<Card className="mb-4">
			<CardHeader>
				<CardTitle>New project</CardTitle>
				<CardDescription>
					A project is how a block of time becomes billable work for one client.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="grid gap-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="grid gap-1.5">
							<Label htmlFor="project-name">Name</Label>
							<Input
								id="project-name"
								value={name}
								onChange={(event) => setName(event.target.value)}
								placeholder="Billing migration"
								required
							/>
						</div>
						<div className="grid gap-1.5">
							<Label htmlFor="project-client">Client (optional)</Label>
							<Input
								id="project-client"
								value={clientName}
								onChange={(event) => setClientName(event.target.value)}
								placeholder="Meridian Health"
							/>
						</div>
						<div className="grid gap-1.5">
							<Label htmlFor="project-color">Colour</Label>
							<Select
								value={color}
								onValueChange={(value) => setColor(value as typeof color)}
							>
								<SelectTrigger id="project-color" className="w-full">
									<SelectValue>
										<span className="flex items-center gap-2">
											<span
												aria-hidden="true"
												className={cn(
													"size-2 shrink-0 rounded-full",
													projectColorSwatchClass(color),
												)}
											/>
											{projectColorName(color)}
										</span>
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{PROJECT_COLOR_VALUES.map((value) => (
										<SelectItem key={value} value={value}>
											<span className="flex items-center gap-2">
												<span
													aria-hidden="true"
													className={cn(
														"size-2 shrink-0 rounded-full",
														projectColorSwatchClass(value),
													)}
												/>
												{projectColorName(value)}
											</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="grid gap-1.5">
							<Label htmlFor="project-rate">
								Billing rate, $ per hour (optional)
							</Label>
							<Input
								id="project-rate"
								type="number"
								min="0"
								step="0.01"
								inputMode="decimal"
								value={rate}
								onChange={(event) => setRate(event.target.value)}
								placeholder="85.00"
							/>
						</div>
					</div>
					<Button
						type="submit"
						disabled={createProject.isPending}
						className="w-fit"
					>
						Create project
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}

function ProjectList() {
	const projects = useProjectList();
	const archiveProject = useArchiveProject();

	if (projects.isPending) {
		return (
			<Skeleton
				role="status"
				className="h-24 w-full"
				aria-label="Loading projects"
			/>
		);
	}

	if (projects.isError) {
		return (
			<p role="alert" className="text-destructive text-sm">
				{projects.error.message}
			</p>
		);
	}

	if (projects.data.length === 0) {
		return (
			<Empty className="ring-1 ring-border">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<FolderTree aria-hidden="true" />
					</EmptyMedia>
					<EmptyTitle>No projects yet</EmptyTitle>
					<EmptyDescription>
						Create one above, then your confirmed time can be grouped and billed
						against it.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<ul className="space-y-px overflow-hidden ring-1 ring-border">
			{projects.data.map((project) => (
				<li
					key={project.id}
					className="flex flex-wrap items-center gap-3 bg-card px-4 py-3 text-sm"
				>
					<span
						aria-hidden="true"
						className={cn(
							"size-2.5 shrink-0 rounded-full",
							projectColorSwatchClass(project.color),
						)}
					/>
					<div className="min-w-0 flex-1">
						<p className="truncate font-medium">{project.name}</p>
						<p className="truncate text-muted-foreground text-xs">
							{project.clientName ?? "No client"}
							{project.billingRateCents !== null &&
								` · ${centsToDollarsLabel(project.billingRateCents)} per hour`}
						</p>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => archiveProject.mutate({ id: project.id })}
						disabled={archiveProject.isPending}
					>
						Archive
					</Button>
				</li>
			))}
		</ul>
	);
}

function CreateMatchingRuleForm() {
	const projects = useProjectList();
	const [projectId, setProjectId] = useState("");
	const [field, setField] = useState<(typeof RULE_FIELD_VALUES)[number]>(
		RULE_FIELD_VALUES[0],
	);
	const [operator, setOperator] =
		useState<(typeof RULE_OPERATOR_VALUES)[number]>("CONTAINS");
	const [value, setValue] = useState("");
	const [label, setLabel] = useState("");
	const createRule = useCreateMatchingRule();

	if (!projects.data || projects.data.length === 0) {
		return null;
	}

	const selectedProject = projects.data.find(
		(project) => project.id === projectId,
	);

	function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		if (projectId === "") {
			toast.error("Choose a project first.");
			return;
		}
		createRule.mutate(
			{
				projectId,
				field,
				operator,
				value,
				label: label.trim() === "" ? null : label.trim(),
				priority: 0,
			},
			{
				onSuccess: () => {
					setValue("");
					setLabel("");
					toast.success("Rule created.");
				},
				onError: (error) => toast.error(error.message),
			},
		);
	}

	return (
		<Card className="mb-4">
			<CardHeader>
				<CardTitle>New rule</CardTitle>
				<CardDescription>
					Rules run before AI is ever asked, so a branch you recognise gets
					labelled the same way every time.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="grid gap-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="grid gap-1.5">
							<Label htmlFor="rule-field">When the</Label>
							<Select
								value={field}
								onValueChange={(next) => setField(next as typeof field)}
							>
								<SelectTrigger id="rule-field" className="w-full">
									<SelectValue>{ruleFieldName(field)}</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{RULE_FIELD_VALUES.map((option) => (
										<SelectItem key={option} value={option}>
											{ruleFieldName(option)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="grid gap-1.5">
							<Label htmlFor="rule-operator">Condition</Label>
							<Select
								value={operator}
								onValueChange={(next) => setOperator(next as typeof operator)}
							>
								<SelectTrigger id="rule-operator" className="w-full">
									<SelectValue>{ruleOperatorName(operator)}</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{RULE_OPERATOR_VALUES.map((option) => (
										<SelectItem key={option} value={option}>
											{ruleOperatorName(option)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="grid gap-1.5">
							<Label htmlFor="rule-value">This text</Label>
							<Input
								id="rule-value"
								value={value}
								onChange={(event) => setValue(event.target.value)}
								placeholder="meridian-billing"
								required
							/>
						</div>
						<div className="grid gap-1.5">
							<Label htmlFor="rule-project">Assign it to</Label>
							<Select
								value={projectId}
								onValueChange={(next) => setProjectId(next ?? "")}
							>
								<SelectTrigger id="rule-project" className="w-full">
									<SelectValue placeholder="Choose a project">
										{selectedProject !== undefined && (
											<span className="flex items-center gap-2">
												<span
													aria-hidden="true"
													className={cn(
														"size-2 shrink-0 rounded-full",
														projectColorSwatchClass(selectedProject.color),
													)}
												/>
												{selectedProject.name}
											</span>
										)}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{projects.data.map((project) => (
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
						<div className="grid gap-1.5 sm:col-span-2">
							<Label htmlFor="rule-label">
								And suggest this label (optional)
							</Label>
							<Input
								id="rule-label"
								value={label}
								onChange={(event) => setLabel(event.target.value)}
								placeholder="Billing migration"
							/>
						</div>
					</div>
					<Button
						type="submit"
						disabled={createRule.isPending}
						className="w-fit"
					>
						Create rule
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}

function MatchingRuleList() {
	const rules = useMatchingRuleList();
	const archiveRule = useArchiveMatchingRule();

	if (rules.isPending) {
		return (
			<Skeleton
				role="status"
				className="h-24 w-full"
				aria-label="Loading rules"
			/>
		);
	}

	if (rules.isError) {
		return (
			<p role="alert" className="text-destructive text-sm">
				{rules.error.message}
			</p>
		);
	}

	if (rules.data.length === 0) {
		return (
			<Empty className="ring-1 ring-border">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<Wand2 aria-hidden="true" />
					</EmptyMedia>
					<EmptyTitle>No rules yet</EmptyTitle>
					<EmptyDescription>
						A rule labels a block the moment it's tracked, with no AI involved
						and nothing sent anywhere.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<ul className="space-y-px overflow-hidden ring-1 ring-border">
			{rules.data.map((rule) => (
				<li
					key={rule.id}
					className="flex flex-wrap items-center gap-3 bg-card px-4 py-3 text-sm"
				>
					<div className="min-w-0 flex-1">
						<p className="flex flex-wrap items-center gap-1.5">
							<span className="text-muted-foreground">
								{ruleFieldName(rule.field)} {ruleOperatorName(rule.operator)}
							</span>
							<code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs">
								{rule.value}
							</code>
						</p>
						<p className="mt-1 flex flex-wrap items-center gap-1.5 text-muted-foreground text-xs">
							Assigned to
							<Badge variant="outline">{rule.projectName}</Badge>
						</p>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => archiveRule.mutate({ id: rule.id })}
						disabled={archiveRule.isPending}
					>
						Archive
					</Button>
				</li>
			))}
		</ul>
	);
}

export default function ProjectsPageClient() {
	return (
		<div className="grid gap-8">
			<section>
				<h2 className="cn-font-heading mb-1 font-medium text-base">Projects</h2>
				<p className="mb-4 max-w-prose text-muted-foreground text-sm">
					Projects group confirmed time for billing. Archiving one keeps its
					history intact.
				</p>
				<CreateProjectForm />
				<ProjectList />
			</section>

			<section>
				<h2 className="cn-font-heading mb-1 font-medium text-base">
					Matching rules
				</h2>
				<p className="mb-4 max-w-prose text-muted-foreground text-sm">
					Map a branch, repository, app, or window title to a project so the
					same work gets labelled the same way without you typing it twice.
				</p>
				<CreateMatchingRuleForm />
				<MatchingRuleList />
			</section>
		</div>
	);
}
