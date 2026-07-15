ALTER TABLE "events" ADD COLUMN "map_link" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "closes_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "idx_attendee_name" ON "attendees" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_attendee_email" ON "attendees" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_attendee_event" ON "attendees" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_event_title" ON "events" USING btree ("title");