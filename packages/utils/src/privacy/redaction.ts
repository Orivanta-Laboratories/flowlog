const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const URL_QUERY_PATTERN = /(https?:\/\/[^\s?#]+)[?#][^\s]*/g;
const BEARER_PATTERN = /\b(?:bearer|token|api[_-]?key|secret|password)\b[:=]?\s*\S+/gi;
const LONG_DIGIT_PATTERN = /\b\d{6,}\b/g;
const REDACTION_MARK = "[redacted]";

export function redactSensitiveText(value: string | null): string | null {
	if (value === null) {
		return null;
	}
	return value
		.replace(BEARER_PATTERN, REDACTION_MARK)
		.replace(EMAIL_PATTERN, REDACTION_MARK)
		.replace(URL_QUERY_PATTERN, "$1")
		.replace(LONG_DIGIT_PATTERN, REDACTION_MARK)
		.trim();
}

export function matchesAnyPattern(value: string, patterns: readonly string[]): boolean {
	const haystack = value.toLowerCase();
	return patterns.some((pattern) => {
		const needle = pattern.toLowerCase();
		return needle.includes("*") ? globToRegExp(needle).test(haystack) : haystack.includes(needle);
	});
}

export function globToRegExp(pattern: string): RegExp {
	const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
	return new RegExp(`^${escaped}$`);
}

export function isExcludedActivity(
	activity: { appName: string | null; windowTitle: string | null },
	exclusions: { appNames: readonly string[]; titlePatterns: readonly string[] },
): boolean {
	if (activity.appName !== null && matchesAnyPattern(activity.appName, exclusions.appNames)) {
		return true;
	}
	if (
		activity.windowTitle !== null &&
		matchesAnyPattern(activity.windowTitle, exclusions.titlePatterns)
	) {
		return true;
	}
	return false;
}
