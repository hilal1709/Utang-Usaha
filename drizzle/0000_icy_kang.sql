CREATE TYPE "public"."period_status" AS ENUM('open', 'locked');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('ADMIN', 'OPCO', 'VIEWER');--> statement-breakpoint
CREATE TYPE "public"."issue_severity" AS ENUM('error', 'warning');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('validating', 'rejected', 'active', 'superseded');--> statement-breakpoint
CREATE TABLE "ap_detail" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"submission_id" integer NOT NULL,
	"period" date NOT NULL,
	"opco_code" text NOT NULL,
	"row" integer,
	"cocd" text,
	"vendor_name" text NOT NULL,
	"top" integer,
	"doc_number" text,
	"invoice_number" text,
	"description" text,
	"document_date" date,
	"posting_date" date,
	"due_date" date,
	"amount" numeric(22, 2) NOT NULL,
	"kategori_vendor" text NOT NULL,
	"kategori_transaksi" text NOT NULL,
	"jenis_transaksi" text NOT NULL,
	"jenis_pembayaran" text NOT NULL,
	"posisi_dokumen" text NOT NULL,
	"status_dokumen" text NOT NULL,
	"masalah_dashboard" text NOT NULL,
	"range_top" text NOT NULL,
	"jatuh_tempo2" text NOT NULL,
	"umur" integer,
	"bucket" text NOT NULL,
	"keterangan_masalah" text,
	"keterangan_lain" text
);
--> statement-breakpoint
CREATE TABLE "ap_summary" (
	"period" date NOT NULL,
	"opco_code" text NOT NULL,
	"kategori_vendor" text NOT NULL,
	"jenis_transaksi" text NOT NULL,
	"jenis_pembayaran" text NOT NULL,
	"masalah_dashboard" text NOT NULL,
	"bucket" text NOT NULL,
	"amount" numeric(22, 2) NOT NULL,
	"rows" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ap_vendor_summary" (
	"period" date NOT NULL,
	"opco_code" text NOT NULL,
	"kategori_vendor" text NOT NULL,
	"vendor_name" text NOT NULL,
	"amount" numeric(22, 2) NOT NULL,
	"over365" numeric(22, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"period" date,
	"opco_code" text,
	"kind" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opcos" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 100 NOT NULL,
	"cocds" text[] DEFAULT '{}' NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "periods" (
	"period" date PRIMARY KEY NOT NULL,
	"status" "period_status" DEFAULT 'open' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_issues" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"submission_id" integer NOT NULL,
	"row" integer,
	"column" text,
	"code" text NOT NULL,
	"message" text NOT NULL,
	"severity" "issue_severity" NOT NULL,
	"value" text,
	"suggestion" text
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"opco_code" text NOT NULL,
	"period" date NOT NULL,
	"version" integer NOT NULL,
	"status" "submission_status" DEFAULT 'validating' NOT NULL,
	"source" text DEFAULT 'upload' NOT NULL,
	"file_name" text,
	"uploaded_by" uuid,
	"row_count" integer DEFAULT 0 NOT NULL,
	"expected_rows" integer DEFAULT 0 NOT NULL,
	"total_amount" numeric(22, 2) DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"warning_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finalized_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "trend_monthly" (
	"period" date NOT NULL,
	"opco_code" text NOT NULL,
	"kategori_vendor" text NOT NULL,
	"amount" numeric(22, 2) NOT NULL,
	CONSTRAINT "trend_monthly_period_opco_code_kategori_vendor_pk" PRIMARY KEY("period","opco_code","kategori_vendor")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'OPCO' NOT NULL,
	"opco_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vendor_master" (
	"key" text PRIMARY KEY NOT NULL,
	"standard_name" text NOT NULL,
	"kategori_vendor" text
);
--> statement-breakpoint
ALTER TABLE "ap_detail" ADD CONSTRAINT "ap_detail_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_issues" ADD CONSTRAINT "submission_issues_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_opco_code_opcos_code_fk" FOREIGN KEY ("opco_code") REFERENCES "public"."opcos"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_opco_code_opcos_code_fk" FOREIGN KEY ("opco_code") REFERENCES "public"."opcos"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "detail_submission" ON "ap_detail" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "summary_period" ON "ap_summary" USING btree ("period","opco_code");--> statement-breakpoint
CREATE INDEX "vendor_summary_period" ON "ap_vendor_summary" USING btree ("period","kategori_vendor");--> statement-breakpoint
CREATE INDEX "issues_submission" ON "submission_issues" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "submissions_period_opco" ON "submissions" USING btree ("period","opco_code");