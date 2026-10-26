ALTER TABLE "submissions" ADD COLUMN "flip_sign" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "column_map" jsonb;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "note" text;