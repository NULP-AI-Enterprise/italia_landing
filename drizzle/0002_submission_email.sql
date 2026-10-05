ALTER TABLE "submissions" ADD COLUMN "notified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "notified_to" text;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "notify_error" text;