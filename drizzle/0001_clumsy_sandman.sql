CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"quiz_mode" text DEFAULT 'standard' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "session_states" ADD COLUMN "user_id" text;