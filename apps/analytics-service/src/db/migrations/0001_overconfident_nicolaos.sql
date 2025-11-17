CREATE TYPE "public"."user_role" AS ENUM('guest', 'admin');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'guest' NOT NULL;