export function centsToDollarsInput(cents: number | null): string {
	return cents === null ? "" : (cents / 100).toFixed(2);
}

export function dollarsInputToCents(value: string): number | null {
	const trimmed = value.trim();
	if (trimmed === "") {
		return null;
	}
	const parsed = Number.parseFloat(trimmed);
	return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
}
