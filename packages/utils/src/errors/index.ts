export class ProjectNotFoundError extends Error {
	readonly code = "PROJECT_NOT_FOUND";
	constructor(projectId: string) {
		super(`Project ${projectId} could not be located for this account.`);
	}
}

export class ProjectNameTakenError extends Error {
	readonly code = "PROJECT_NAME_TAKEN";
	constructor(name: string) {
		super(`A project named ${name} already exists for this account.`);
	}
}

export class ActivitySessionNotFoundError extends Error {
	readonly code = "ACTIVITY_SESSION_NOT_FOUND";
	constructor(activitySessionId: string) {
		super(
			`Activity session ${activitySessionId} could not be located for this account.`,
		);
	}
}

export class ActivitySessionAlreadyConfirmedError extends Error {
	readonly code = "ACTIVITY_SESSION_ALREADY_CONFIRMED";
	constructor(activitySessionId: string) {
		super(`Activity session ${activitySessionId} has already been confirmed.`);
	}
}

export class ActivitySessionNotAdjacentError extends Error {
	readonly code = "ACTIVITY_SESSION_NOT_ADJACENT";
	constructor() {
		super("Only activity sessions that follow one another can be merged.");
	}
}

export class ActivitySessionSplitOutOfRangeError extends Error {
	readonly code = "ACTIVITY_SESSION_SPLIT_OUT_OF_RANGE";
	constructor() {
		super("The split point falls outside the activity session boundaries.");
	}
}

export class MatchingRuleNotFoundError extends Error {
	readonly code = "MATCHING_RULE_NOT_FOUND";
	constructor(matchingRuleId: string) {
		super(
			`Matching rule ${matchingRuleId} could not be located for this account.`,
		);
	}
}

export class DeviceNotFoundError extends Error {
	readonly code = "DEVICE_NOT_FOUND";
	constructor(deviceId: string) {
		super(`Device ${deviceId} could not be located for this account.`);
	}
}

export class DeviceTokenInvalidError extends Error {
	readonly code = "DEVICE_TOKEN_INVALID";
	constructor() {
		super("The supplied device token is not valid or has been revoked.");
	}
}

export class PairingRequestNotFoundError extends Error {
	readonly code = "PAIRING_REQUEST_NOT_FOUND";
	constructor(pairingId: string) {
		super(
			`Pairing request ${pairingId} has expired or was already used. Start a new connection from the device.`,
		);
	}
}

export class AiLabelingNotConsentedError extends Error {
	readonly code = "AI_LABELING_NOT_CONSENTED";
	constructor() {
		super("Assisted labeling is switched off for this account.");
	}
}

export class AiLabelingUnavailableError extends Error {
	readonly code = "AI_LABELING_UNAVAILABLE";
	constructor() {
		super("The assisted labeling service did not return a usable suggestion.");
	}
}

export class ExportRangeTooLargeError extends Error {
	readonly code = "EXPORT_RANGE_TOO_LARGE";
	constructor(maximumDays: number) {
		super(`Timesheet exports cover at most ${maximumDays} days per request.`);
	}
}

export class OrganizationNotFoundError extends Error {
	readonly code = "ORGANIZATION_NOT_FOUND";
	constructor() {
		super("This account does not belong to an organization yet.");
	}
}

export class OrganizationOwnerOnlyError extends Error {
	readonly code = "ORGANIZATION_OWNER_ONLY";
	constructor() {
		super("Only the organization owner can view this.");
	}
}

export type FlowlogError =
	| ProjectNotFoundError
	| ProjectNameTakenError
	| ActivitySessionNotFoundError
	| ActivitySessionAlreadyConfirmedError
	| ActivitySessionNotAdjacentError
	| ActivitySessionSplitOutOfRangeError
	| MatchingRuleNotFoundError
	| DeviceNotFoundError
	| DeviceTokenInvalidError
	| PairingRequestNotFoundError
	| AiLabelingNotConsentedError
	| AiLabelingUnavailableError
	| ExportRangeTooLargeError
	| OrganizationNotFoundError
	| OrganizationOwnerOnlyError;

export type FlowlogErrorCode = FlowlogError["code"];
