import { createHash, randomBytes } from "node:crypto";

const TOKEN_BYTE_LENGTH = 32;
const TOKEN_PREFIX = "flg";
const PREVIEW_LENGTH = 8;

export type IssuedDeviceToken = {
	token: string;
	tokenHash: string;
	tokenPreview: string;
};

export function hashDeviceToken(token: string): string {
	return createHash("sha256").update(token).digest("hex");
}

export function issueDeviceToken(): IssuedDeviceToken {
	const token = `${TOKEN_PREFIX}_${randomBytes(TOKEN_BYTE_LENGTH).toString("base64url")}`;
	return {
		token,
		tokenHash: hashDeviceToken(token),
		tokenPreview: `${token.slice(0, TOKEN_PREFIX.length + 1 + PREVIEW_LENGTH)}…`,
	};
}
