import { ORPCError } from "@orpc/server";

const NOT_FOUND_CODES = new Set([
	"PROJECT_NOT_FOUND",
	"ACTIVITY_SESSION_NOT_FOUND",
	"MATCHING_RULE_NOT_FOUND",
	"DEVICE_NOT_FOUND",
]);

const CONFLICT_CODES = new Set([
	"PROJECT_NAME_TAKEN",
	"ACTIVITY_SESSION_ALREADY_CONFIRMED",
]);

const BAD_REQUEST_CODES = new Set([
	"ACTIVITY_SESSION_NOT_ADJACENT",
	"ACTIVITY_SESSION_SPLIT_OUT_OF_RANGE",
	"EXPORT_RANGE_TOO_LARGE",
	"AI_LABELING_NOT_CONSENTED",
	"AI_LABELING_UNAVAILABLE",
]);

export function toDomainOrpcError(
	error: unknown,
): ORPCError<string, undefined> | null {
	if (
		!(error instanceof Error) ||
		!("code" in error) ||
		typeof error.code !== "string"
	) {
		return null;
	}
	if (error.code === "DEVICE_TOKEN_INVALID") {
		return new ORPCError("UNAUTHORIZED", { message: error.message });
	}
	if (NOT_FOUND_CODES.has(error.code)) {
		return new ORPCError(error.code, { status: 404, message: error.message });
	}
	if (CONFLICT_CODES.has(error.code)) {
		return new ORPCError(error.code, { status: 409, message: error.message });
	}
	if (BAD_REQUEST_CODES.has(error.code)) {
		return new ORPCError(error.code, { status: 400, message: error.message });
	}
	return null;
}

export function throwAsOrpcError(error: unknown): never {
	const mapped = toDomainOrpcError(error);
	if (mapped !== null) {
		throw mapped;
	}
	throw error;
}
