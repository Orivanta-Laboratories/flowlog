"use client";

import {
	PROJECT_COLOR_VALUES,
	RULE_FIELD_VALUES,
	RULE_OPERATOR_VALUES,
} from "@flowlog/db/constants";
import { Button } from "@flowlog/ui/components/button";
import {
	Empty,
	EmptyDescription,
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
import { useState } from "react";
import { toast } from "sonner";

import { dollarsInputToCents } from "@/helpers/format-currency";
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
		<form
			onSubmit={handleSubmit}
			className="mb-8 grid gap-3 rounded-md border p-4"
		>
			<div className="grid gap-3 sm:grid-cols-2">
				<div>
					<Label htmlFor="project-name">Name</Label>
					<Input
						id="project-name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
				</div>
				<div>
					<Label htmlFor="project-client">Client (optional)</Label>
					<Input
						id="project-client"
						value={clientName}
						onChange={(e) => setClientName(e.target.value)}
					/>
				</div>
				<div>
					<Label htmlFor="project-color">Color</Label>
					<Select
						value={color}
						onValueChange={(value) => setColor(value as typeof color)}
					>
						<SelectTrigger id="project-color" className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{PROJECT_COLOR_VALUES.map((value) => (
								<SelectItem key={value} value={value}>
									{value}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div>
					<Label htmlFor="project-rate">Billing rate ($/hr, optional)</Label>
					<Input
						id="project-rate"
						type="number"
						min="0"
						step="0.01"
						value={rate}
						onChange={(e) => setRate(e.target.value)}
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
	);
}

function ProjectList() {
	const projects = useProjectList();
	const archiveProject = useArchiveProject();

	if (projects.isPending) {
		return <Skeleton className="h-24 w-full" />;
	}

	if (projects.isError) {
		return <p className="text-destructive text-sm">{projects.error.message}</p>;
	}

	if (projects.data.length === 0) {
		return (
			<Empty className="mb-8">
				<EmptyTitle>No projects yet</EmptyTitle>
				<EmptyDescription>
					Create one above to start mapping suggestions to it.
				</EmptyDescription>
			</Empty>
		);
	}

	return (
		<ul className="mb-8 divide-y rounded-md border">
			{projects.data.map((project) => (
				<li
					key={project.id}
					className="flex items-center justify-between px-4 py-2 text-sm"
				>
					<div>
						<span className="font-medium">{project.name}</span>
						{project.clientName !== null && (
							<span className="ml-2 text-muted-foreground">
								{project.clientName}
							</span>
						)}
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
		<form
			onSubmit={handleSubmit}
			className="mb-6 grid gap-3 rounded-md border p-4"
		>
			<div className="grid gap-3 sm:grid-cols-2">
				<div>
					<Label htmlFor="rule-project">Project</Label>
					<Select
						value={projectId}
						onValueChange={(value) => setProjectId(value ?? "")}
					>
						<SelectTrigger id="rule-project" className="w-full">
							<SelectValue placeholder="Choose a project" />
						</SelectTrigger>
						<SelectContent>
							{projects.data.map((project) => (
								<SelectItem key={project.id} value={project.id}>
									{project.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div>
					<Label htmlFor="rule-field">Field</Label>
					<Select
						value={field}
						onValueChange={(v) => setField(v as typeof field)}
					>
						<SelectTrigger id="rule-field" className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{RULE_FIELD_VALUES.map((value) => (
								<SelectItem key={value} value={value}>
									{value}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div>
					<Label htmlFor="rule-operator">Operator</Label>
					<Select
						value={operator}
						onValueChange={(v) => setOperator(v as typeof operator)}
					>
						<SelectTrigger id="rule-operator" className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{RULE_OPERATOR_VALUES.map((value) => (
								<SelectItem key={value} value={value}>
									{value}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div>
					<Label htmlFor="rule-value">Value</Label>
					<Input
						id="rule-value"
						value={value}
						onChange={(e) => setValue(e.target.value)}
						placeholder="acme-*"
						required
					/>
				</div>
				<div className="sm:col-span-2">
					<Label htmlFor="rule-label">Label override (optional)</Label>
					<Input
						id="rule-label"
						value={label}
						onChange={(e) => setLabel(e.target.value)}
					/>
				</div>
			</div>
			<Button type="submit" disabled={createRule.isPending} className="w-fit">
				Create rule
			</Button>
		</form>
	);
}

function MatchingRuleList() {
	const rules = useMatchingRuleList();
	const archiveRule = useArchiveMatchingRule();

	if (rules.isPending) {
		return <Skeleton className="h-24 w-full" />;
	}

	if (rules.isError) {
		return <p className="text-destructive text-sm">{rules.error.message}</p>;
	}

	if (rules.data.length === 0) {
		return (
			<Empty>
				<EmptyTitle>No rules yet</EmptyTitle>
				<EmptyDescription>
					Rules give you a 98% confidence, zero-cost suggestion before AI is
					ever asked.
				</EmptyDescription>
			</Empty>
		);
	}

	return (
		<ul className="divide-y rounded-md border">
			{rules.data.map((rule) => (
				<li
					key={rule.id}
					className="flex items-center justify-between px-4 py-2 text-sm"
				>
					<span>
						{rule.field} {rule.operator} <code>{rule.value}</code> →{" "}
						{rule.projectName}
					</span>
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
		<>
			<CreateProjectForm />
			<ProjectList />
			<h2 className="mb-1 font-medium text-base">Matching rules</h2>
			<p className="mb-4 text-muted-foreground text-sm">
				Auto-map a branch, repo, app, or window title pattern to a project.
			</p>
			<CreateMatchingRuleForm />
			<MatchingRuleList />
		</>
	);
}
