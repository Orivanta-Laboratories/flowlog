export type ActivitySignals = {
	appName: string;
	windowTitle: string | null;
	repoName: string | null;
	branchName: string | null;
};

export function buildSignalFingerprint(signals: ActivitySignals): string {
	return [
		`app:${signals.appName.trim().toLowerCase()}`,
		`repo:${signals.repoName?.trim().toLowerCase() ?? "-"}`,
		`branch:${signals.branchName?.trim().toLowerCase() ?? "-"}`,
	].join("|");
}
