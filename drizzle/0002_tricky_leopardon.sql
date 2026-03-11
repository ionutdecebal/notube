ALTER TABLE "session_states" ADD COLUMN "topic" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "session_states" ADD COLUMN "selected_video_id" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "session_states" ADD COLUMN "selected_video_title" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "session_states" ADD COLUMN "selected_video_channel" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "session_states" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "session_states" ADD COLUMN "watch_percent" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "session_states" ADD COLUMN "quiz_score" integer;--> statement-breakpoint
ALTER TABLE "session_states" ADD COLUMN "quiz_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "session_states" ADD COLUMN "reflection_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "session_states" ADD COLUMN "backups_opened" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "session_states" ADD COLUMN "feedback_count" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
UPDATE "session_states"
SET
  "topic" = COALESCE("state"->'session'->>'topic', ''),
  "selected_video_id" = COALESCE("state"->'session'->>'selectedVideoId', ''),
  "selected_video_title" = COALESCE(
    (
      SELECT candidate->>'title'
      FROM jsonb_array_elements(COALESCE("state"->'videoCandidates', '[]'::jsonb)) AS candidate
      WHERE candidate->>'id' = "state"->'session'->>'selectedVideoId'
      LIMIT 1
    ),
    ''
  ),
  "selected_video_channel" = COALESCE(
    (
      SELECT candidate->>'channel'
      FROM jsonb_array_elements(COALESCE("state"->'videoCandidates', '[]'::jsonb)) AS candidate
      WHERE candidate->>'id' = "state"->'session'->>'selectedVideoId'
      LIMIT 1
    ),
    ''
  ),
  "created_at" = COALESCE(("state"->'session'->>'createdAt')::timestamp with time zone, "updated_at"),
  "watch_percent" = LEAST(
    100,
    GREATEST(
      0,
      CASE
        WHEN COALESCE(("state"->'watchProgress'->>'durationSeconds')::numeric, 0) <= 0 THEN 0
        ELSE ROUND(
          (
            COALESCE(("state"->'watchProgress'->>'watchedSeconds')::numeric, 0)
            / NULLIF(("state"->'watchProgress'->>'durationSeconds')::numeric, 0)
          ) * 100
        )::integer
      END
    )
  ),
  "quiz_score" = CASE
    WHEN "state"->'learningScore'->>'total' IS NULL THEN NULL
    ELSE ("state"->'learningScore'->>'total')::integer
  END,
  "quiz_completed" = ("state"->'quizAttempt') IS NOT NULL AND ("state"->'learningScore') IS NOT NULL,
  "reflection_completed" = ("state"->'reflection') IS NOT NULL,
  "backups_opened" = COALESCE(
    (
      SELECT COUNT(*)::integer
      FROM jsonb_array_elements(COALESCE("state"->'skipEvents', '[]'::jsonb)) AS event
      WHERE event->>'stage' = 'watch'
    ),
    0
  ),
  "feedback_count" = COALESCE(jsonb_array_length(COALESCE("state"->'suggestionFeedback', '[]'::jsonb)), 0);
