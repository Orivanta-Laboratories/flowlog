ALTER TABLE "user" ADD COLUMN "ai_consent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "work_schedule" jsonb;