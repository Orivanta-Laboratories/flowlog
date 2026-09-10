CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'rejected', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."locale" AS ENUM('en', 'fr');--> statement-breakpoint
CREATE TYPE "public"."org_role" AS ENUM('owner', 'member');--> statement-breakpoint
CREATE TYPE "public"."device_platform" AS ENUM('LINUX', 'MACOS', 'WINDOWS', 'CHROME_EXTENSION');--> statement-breakpoint
CREATE TYPE "public"."event_source" AS ENUM('OS', 'GIT', 'BROWSER');--> statement-breakpoint
CREATE TYPE "public"."project_color" AS ENUM('chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5');--> statement-breakpoint
CREATE TYPE "public"."rule_field" AS ENUM('APP_NAME', 'REPO_NAME', 'BRANCH_NAME', 'WINDOW_TITLE');--> statement-breakpoint
CREATE TYPE "public"."rule_operator" AS ENUM('EQUALS', 'CONTAINS', 'GLOB');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('SUGGESTED', 'CONFIRMED');--> statement-breakpoint
CREATE TYPE "public"."suggestion_source" AS ENUM('RULE', 'HISTORY', 'AI', 'NONE');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"issuer" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" "org_role" NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"inviter_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "org_role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"locale" "locale" DEFAULT 'en' NOT NULL,
	"ai_labeling_enabled" boolean DEFAULT false NOT NULL,
	"excluded_app_names" text[] DEFAULT '{}' NOT NULL,
	"excluded_title_patterns" text[] DEFAULT '{}' NOT NULL,
	"excluded_domains" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone NOT NULL,
	"duration_seconds" integer NOT NULL,
	"app_name" text NOT NULL,
	"window_title" text,
	"repo_name" text,
	"branch_name" text,
	"commit_subjects" text[] DEFAULT '{}' NOT NULL,
	"signal_fingerprint" text NOT NULL,
	"status" "session_status" DEFAULT 'SUGGESTED' NOT NULL,
	"suggested_label" text,
	"suggested_project_id" uuid,
	"suggestion_source" "suggestion_source" DEFAULT 'NONE' NOT NULL,
	"suggestion_rationale" text,
	"confidence_percent" integer DEFAULT 0 NOT NULL,
	"final_label" text,
	"project_id" uuid,
	"edited" boolean DEFAULT false NOT NULL,
	"confirmed_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "confirmation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"activity_session_id" uuid NOT NULL,
	"signal_fingerprint" text NOT NULL,
	"final_label" text NOT NULL,
	"final_project_id" uuid,
	"suggested_label" text,
	"suggested_project_id" uuid,
	"suggestion_source" "suggestion_source" NOT NULL,
	"confidence_percent" integer NOT NULL,
	"edited" boolean NOT NULL,
	"confirmed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"platform" "device_platform" NOT NULL,
	"token_hash" text NOT NULL,
	"token_preview" text NOT NULL,
	"last_seen_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matching_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"field" "rule_field" NOT NULL,
	"operator" "rule_operator" DEFAULT 'CONTAINS' NOT NULL,
	"value" text NOT NULL,
	"label" text,
	"priority" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"client_name" text,
	"color" "project_color" DEFAULT 'chart-1' NOT NULL,
	"billing_rate_cents" integer,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raw_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"device_id" uuid NOT NULL,
	"client_event_id" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"source" "event_source" NOT NULL,
	"app_name" text,
	"window_title" text,
	"repo_name" text,
	"branch_name" text,
	"commit_subject" text,
	"is_idle" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_active_organization_id_organization_id_fk" FOREIGN KEY ("active_organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_session" ADD CONSTRAINT "activity_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_session" ADD CONSTRAINT "activity_session_suggested_project_id_project_id_fk" FOREIGN KEY ("suggested_project_id") REFERENCES "public"."project"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_session" ADD CONSTRAINT "activity_session_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "confirmation" ADD CONSTRAINT "confirmation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "confirmation" ADD CONSTRAINT "confirmation_activity_session_id_activity_session_id_fk" FOREIGN KEY ("activity_session_id") REFERENCES "public"."activity_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "confirmation" ADD CONSTRAINT "confirmation_final_project_id_project_id_fk" FOREIGN KEY ("final_project_id") REFERENCES "public"."project"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "confirmation" ADD CONSTRAINT "confirmation_suggested_project_id_project_id_fk" FOREIGN KEY ("suggested_project_id") REFERENCES "public"."project"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device" ADD CONSTRAINT "device_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matching_rule" ADD CONSTRAINT "matching_rule_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matching_rule" ADD CONSTRAINT "matching_rule_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_event" ADD CONSTRAINT "raw_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_event" ADD CONSTRAINT "raw_event_device_id_device_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."device"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_issuer_accountId_uidx" ON "account" USING btree ("issuer","account_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invitation_organization_id_idx" ON "invitation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "member_organization_id_idx" ON "member" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "member_organization_id_user_id_uidx" ON "member" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "member_user_id_uidx" ON "member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "activity_session_user_id_fingerprint_idx" ON "activity_session" USING btree ("user_id","signal_fingerprint");--> statement-breakpoint
CREATE INDEX "activity_session_project_id_idx" ON "activity_session" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "activity_session_user_id_started_at_uidx" ON "activity_session" USING btree ("user_id","started_at");--> statement-breakpoint
CREATE INDEX "confirmation_user_id_fingerprint_idx" ON "confirmation" USING btree ("user_id","signal_fingerprint","confirmed_at");--> statement-breakpoint
CREATE INDEX "confirmation_activity_session_id_idx" ON "confirmation" USING btree ("activity_session_id");--> statement-breakpoint
CREATE INDEX "device_user_id_idx" ON "device" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "device_token_hash_uidx" ON "device" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "matching_rule_user_id_idx" ON "matching_rule" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "matching_rule_project_id_idx" ON "matching_rule" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_user_id_idx" ON "project" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_user_id_name_uidx" ON "project" USING btree ("user_id","name") WHERE "project"."archived_at" is null;--> statement-breakpoint
CREATE INDEX "raw_event_user_id_occurred_at_idx" ON "raw_event" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "raw_event_device_id_client_event_id_uidx" ON "raw_event" USING btree ("device_id","client_event_id");