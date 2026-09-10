const TRACKABLE_PROTOCOLS = new Set(["http:", "https:"]);

export function extractDomain(url: string): string | null {
	try {
		const parsed = new URL(url);
		if (!TRACKABLE_PROTOCOLS.has(parsed.protocol)) {
			return null;
		}
		return parsed.hostname.replace(/^www\./, "");
	} catch {
		return null;
	}
}

function globToRegExp(pattern: string): RegExp {
	const escaped = pattern
		.replace(/[.+^${}()|[\]\\]/g, "\\$&")
		.replace(/\*/g, ".*")
		.replace(/\?/g, ".");
	return new RegExp(`^${escaped}$`);
}

export function isDomainExcluded(
	domain: string,
	patterns: readonly string[],
): boolean {
	const haystack = domain.toLowerCase();
	return patterns.some((pattern) => {
		const needle = pattern.toLowerCase();
		return needle.includes("*")
			? globToRegExp(needle).test(haystack)
			: haystack === needle;
	});
}
