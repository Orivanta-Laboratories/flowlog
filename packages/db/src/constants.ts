export const EVENT_SOURCE = {
	OS: "OS",
	GIT: "GIT",
	BROWSER: "BROWSER",
} as const;

export type EventSource = (typeof EVENT_SOURCE)[keyof typeof EVENT_SOURCE];

export const SESSION_STATUS = {
	SUGGESTED: "SUGGESTED",
	CONFIRMED: "CONFIRMED",
} as const;

export type SessionStatus =
	(typeof SESSION_STATUS)[keyof typeof SESSION_STATUS];

export const SUGGESTION_SOURCE = {
	RULE: "RULE",
	HISTORY: "HISTORY",
	AI: "AI",
	NONE: "NONE",
} as const;

export type SuggestionSource =
	(typeof SUGGESTION_SOURCE)[keyof typeof SUGGESTION_SOURCE];

export const RULE_FIELD = {
	APP_NAME: "APP_NAME",
	REPO_NAME: "REPO_NAME",
	BRANCH_NAME: "BRANCH_NAME",
	WINDOW_TITLE: "WINDOW_TITLE",
} as const;

export type RuleField = (typeof RULE_FIELD)[keyof typeof RULE_FIELD];

export const RULE_OPERATOR = {
	EQUALS: "EQUALS",
	CONTAINS: "CONTAINS",
	GLOB: "GLOB",
} as const;

export type RuleOperator = (typeof RULE_OPERATOR)[keyof typeof RULE_OPERATOR];

export const DEVICE_PLATFORM = {
	LINUX: "LINUX",
	MACOS: "MACOS",
	WINDOWS: "WINDOWS",
	CHROME_EXTENSION: "CHROME_EXTENSION",
} as const;

export type DevicePlatform =
	(typeof DEVICE_PLATFORM)[keyof typeof DEVICE_PLATFORM];

export const LOCALE = {
	EN: "en",
	FR: "fr",
} as const;

export type Locale = (typeof LOCALE)[keyof typeof LOCALE];

export const PROJECT_COLOR = {
	CHART_1: "chart-1",
	CHART_2: "chart-2",
	CHART_3: "chart-3",
	CHART_4: "chart-4",
	CHART_5: "chart-5",
} as const;

export type ProjectColor = (typeof PROJECT_COLOR)[keyof typeof PROJECT_COLOR];

export const EVENT_SOURCE_VALUES = [
	EVENT_SOURCE.OS,
	EVENT_SOURCE.GIT,
	EVENT_SOURCE.BROWSER,
] as const;

export const SESSION_STATUS_VALUES = [
	SESSION_STATUS.SUGGESTED,
	SESSION_STATUS.CONFIRMED,
] as const;

export const SUGGESTION_SOURCE_VALUES = [
	SUGGESTION_SOURCE.RULE,
	SUGGESTION_SOURCE.HISTORY,
	SUGGESTION_SOURCE.AI,
	SUGGESTION_SOURCE.NONE,
] as const;

export const RULE_FIELD_VALUES = [
	RULE_FIELD.APP_NAME,
	RULE_FIELD.REPO_NAME,
	RULE_FIELD.BRANCH_NAME,
	RULE_FIELD.WINDOW_TITLE,
] as const;

export const RULE_OPERATOR_VALUES = [
	RULE_OPERATOR.EQUALS,
	RULE_OPERATOR.CONTAINS,
	RULE_OPERATOR.GLOB,
] as const;

export const DEVICE_PLATFORM_VALUES = [
	DEVICE_PLATFORM.LINUX,
	DEVICE_PLATFORM.MACOS,
	DEVICE_PLATFORM.WINDOWS,
	DEVICE_PLATFORM.CHROME_EXTENSION,
] as const;

export const MAX_EXPORT_RANGE_DAYS = 92;
export const AI_SUGGESTION_BATCH_CAP = 5;

export const LOCALE_VALUES = [LOCALE.EN, LOCALE.FR] as const;

export const PROJECT_COLOR_VALUES = [
	PROJECT_COLOR.CHART_1,
	PROJECT_COLOR.CHART_2,
	PROJECT_COLOR.CHART_3,
	PROJECT_COLOR.CHART_4,
	PROJECT_COLOR.CHART_5,
] as const;
