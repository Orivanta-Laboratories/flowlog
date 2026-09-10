export function textToList(value: string): string[] {
	return value
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.length > 0);
}

export function listToText(values: readonly string[]): string {
	return values.join("\n");
}
