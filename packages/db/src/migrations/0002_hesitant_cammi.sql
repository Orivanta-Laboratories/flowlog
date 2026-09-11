ALTER TABLE "device_pairing_request" ADD COLUMN "token_hash" text;--> statement-breakpoint
ALTER TABLE "device_pairing_request" ADD COLUMN "token_preview" text;--> statement-breakpoint
ALTER TABLE "device_pairing_request" DROP COLUMN "raw_token";