export type StoredConfig = {
	serverUrl: string;
	deviceToken: string;
	paused: boolean;
};

export type StoredExclusions = {
	domains: string[];
};

export type QueuedEvent = {
	clientEventId: string;
	occurredAt: string;
	source: "BROWSER";
	appName: string | null;
	windowTitle: string | null;
	repoName: null;
	branchName: null;
	commitSubject: null;
	isIdle: boolean;
};
