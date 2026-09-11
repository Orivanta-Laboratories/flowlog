CREATE TYPE "public"."pairing_request_status" AS ENUM('PENDING', 'APPROVED', 'CLAIMED');--> statement-breakpoint
CREATE TABLE "device_pairing_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" "device_platform" NOT NULL,
	"status" "pairing_request_status" DEFAULT 'PENDING' NOT NULL,
	"user_id" text,
	"device_id" uuid,
	"raw_token" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "device_pairing_request" ADD CONSTRAINT "device_pairing_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_pairing_request" ADD CONSTRAINT "device_pairing_request_device_id_device_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."device"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "device_pairing_request_expires_at_idx" ON "device_pairing_request" USING btree ("expires_at");