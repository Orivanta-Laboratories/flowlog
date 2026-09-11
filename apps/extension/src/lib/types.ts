export type StoredConfig = {
	deviceToken: string;
	paused: boolean;
};

export type PairingStatusResponse =
	| { status: "pending" }
	| { status: "approved"; deviceId: string }
	| { status: "claimed" }
	| { status: "expired" };

export type StoredExclusions = {
	workSchedule?: import("@flowlog/utils/time/shift").WorkSchedule | null;
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
