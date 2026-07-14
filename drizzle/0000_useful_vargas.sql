CREATE TYPE "public"."attendee_status" AS ENUM('registered', 'checked_in', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."event_admin_role" AS ENUM('owner', 'editor', 'scanner');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('draft', 'open', 'closed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."scan_result" AS ENUM('success', 'duplicate', 'invalid_event', 'invalid_ticket');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "attendees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"scan_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"local" text,
	"district" text,
	"zone" text,
	"duty" text,
	"status" "attendee_status" DEFAULT 'registered' NOT NULL,
	"registered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"checked_in_at" timestamp with time zone,
	"checked_in_by" uuid,
	CONSTRAINT "attendees_scan_token_unique" UNIQUE("scan_token")
);
--> statement-breakpoint
CREATE TABLE "event_admins" (
	"event_id" uuid NOT NULL,
	"admin_id" uuid NOT NULL,
	"role" "event_admin_role" DEFAULT 'scanner' NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_admins_event_id_admin_id_pk" PRIMARY KEY("event_id","admin_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"date" timestamp with time zone NOT NULL,
	"location" text,
	"max_attendees" integer,
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"google_sheet_id" text,
	"google_sheet_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "scan_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attendee_id" uuid,
	"event_id" uuid NOT NULL,
	"scanned_by" uuid NOT NULL,
	"result" "scan_result" NOT NULL,
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sheet_sync_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"status" "sync_status" DEFAULT 'pending' NOT NULL,
	"rows_synced" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "attendees" ADD CONSTRAINT "attendees_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendees" ADD CONSTRAINT "attendees_checked_in_by_admins_id_fk" FOREIGN KEY ("checked_in_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_admins" ADD CONSTRAINT "event_admins_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_admins" ADD CONSTRAINT "event_admins_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_admins_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_logs" ADD CONSTRAINT "scan_logs_attendee_id_attendees_id_fk" FOREIGN KEY ("attendee_id") REFERENCES "public"."attendees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_logs" ADD CONSTRAINT "scan_logs_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_logs" ADD CONSTRAINT "scan_logs_scanned_by_admins_id_fk" FOREIGN KEY ("scanned_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_sync_logs" ADD CONSTRAINT "sheet_sync_logs_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unq_event_email" ON "attendees" USING btree ("event_id","email");