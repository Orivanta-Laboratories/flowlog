import { SUGGESTION_SOURCE } from "@flowlog/db/constants";
import { generateObject, type LanguageModel } from "ai";
import { z } from "zod";

import type { ActivitySignals } from "./fingerprint";
import type { LabelSuggestion } from "./suggest";

const aiSuggestionSchema = z.object({
	label: z.string().min(1).max(120),
	matchedProjectName: z.string().nullable(),
	confidencePercent: z.number().min(0).max(100),
	rationale: z.string().min(1).max(280),
});

export type AiProjectOption = {
	id: string;
	name: string;
};

export type AiSuggestionInput = {
	signals: ActivitySignals;
	durationSeconds: number;
	commitSubjects: readonly string[];
	knownProjects: readonly AiProjectOption[];
};

function buildPrompt(input: AiSuggestionInput): string {
	const lines = [
		"You label a single block of tracked work time for a freelancer's timesheet.",
		"Given only structured app/repo metadata (never message content), suggest a short,",
		"business-appropriate label and, if one of the known projects clearly matches, its name.",
		"",
		`App: ${input.signals.appName}`,
		`Window title: ${input.signals.windowTitle ?? "(none)"}`,
		`Repository: ${input.signals.repoName ?? "(none)"}`,
		`Branch: ${input.signals.branchName ?? "(none)"}`,
		`Duration: ${Math.round(input.durationSeconds / 60)} minutes`,
	];
	if (input.commitSubjects.length > 0) {
		lines.push(`Commit subjects: ${input.commitSubjects.join("; ")}`);
	}
	lines.push(
		"",
		"Known projects (pick matchedProjectName from this list verbatim, or null if none fit):",
		input.knownProjects.length > 0
			? input.knownProjects.map((project) => `- ${project.name}`).join("\n")
			: "(no projects created yet)",
	);
	return lines.join("\n");
}

export async function buildAiSuggestion(
	model: LanguageModel,
	input: AiSuggestionInput,
): Promise<LabelSuggestion | null> {
	try {
		const result = await generateObject({
			model,
			schema: aiSuggestionSchema,
			prompt: buildPrompt(input),
		});
		const matchedProject = input.knownProjects.find(
			(project) => project.name === result.object.matchedProjectName,
		);
		return {
			label: result.object.label,
			projectId: matchedProject?.id ?? null,
			confidencePercent: Math.round(result.object.confidencePercent),
			source: SUGGESTION_SOURCE.AI,
			rationale: result.object.rationale,
		};
	} catch {
		return null;
	}
}
