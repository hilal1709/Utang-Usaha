ALTER TYPE "public"."role" ADD VALUE 'SUPERADMIN' BEFORE 'ADMIN';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp with time zone;