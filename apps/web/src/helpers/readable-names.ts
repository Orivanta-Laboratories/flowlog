import {
	DEVICE_PLATFORM,
	type DevicePlatform,
	PROJECT_COLOR,
	type ProjectColor,
	RULE_FIELD,
	RULE_OPERATOR,
	type RuleField,
	type RuleOperator,
	SUGGESTION_SOURCE,
	type SuggestionSource,
} from "@flowlog/db/constants";

const RULE_FIELD_NAMES: Record<RuleField, string> = {
	[RULE_FIELD.APP_NAME]: "App name",
	[RULE_FIELD.REPO_NAME]: "Repository",
	[RULE_FIELD.BRANCH_NAME]: "Branch",
	[RULE_FIELD.WINDOW_TITLE]: "Window title",
};

const RULE_OPERATOR_NAMES: Record<RuleOperator, string> = {
	[RULE_OPERATOR.EQUALS]: "is exactly",
	[RULE_OPERATOR.CONTAINS]: "contains",
	[RULE_OPERATOR.GLOB]: "matches pattern",
};

const DEVICE_PLATFORM_NAMES: Record<DevicePlatform, string> = {
	[DEVICE_PLATFORM.LINUX]: "Linux desktop",
	[DEVICE_PLATFORM.MACOS]: "macOS desktop",
	[DEVICE_PLATFORM.WINDOWS]: "Windows desktop",
	[DEVICE_PLATFORM.CHROME_EXTENSION]: "Browser extension",
};

const PROJECT_COLOR_NAMES: Record<ProjectColor, string> = {
	[PROJECT_COLOR.CHART_1]: "Forest",
	[PROJECT_COLOR.CHART_2]: "Teal",
	[PROJECT_COLOR.CHART_3]: "Amber",
	[PROJECT_COLOR.CHART_4]: "Clay",
	[PROJECT_COLOR.CHART_5]: "Moss",
};

const SUGGESTION_SOURCE_NAMES: Record<SuggestionSource, string> = {
	[SUGGESTION_SOURCE.RULE]: "Your rule",
	[SUGGESTION_SOURCE.HISTORY]: "Past labels",
	[SUGGESTION_SOURCE.AI]: "AI",
	[SUGGESTION_SOURCE.NONE]: "Unlabeled",
};

export function ruleFieldName(field: RuleField): string {
	return RULE_FIELD_NAMES[field];
}

export function ruleOperatorName(operator: RuleOperator): string {
	return RULE_OPERATOR_NAMES[operator];
}

export function devicePlatformName(platform: DevicePlatform): string {
	return DEVICE_PLATFORM_NAMES[platform];
}

export function projectColorName(color: ProjectColor): string {
	return PROJECT_COLOR_NAMES[color];
}

export function suggestionSourceName(source: SuggestionSource): string {
	return SUGGESTION_SOURCE_NAMES[source];
}

export function projectColorSwatchClass(color: ProjectColor): string {
	switch (color) {
		case PROJECT_COLOR.CHART_1:
			return "bg-chart-1";
		case PROJECT_COLOR.CHART_2:
			return "bg-chart-2";
		case PROJECT_COLOR.CHART_3:
			return "bg-chart-3";
		case PROJECT_COLOR.CHART_4:
			return "bg-chart-4";
		default:
			return "bg-chart-5";
	}
}
