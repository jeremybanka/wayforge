ALTER TABLE "users" ADD COLUMN "password" varchar(254) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "hash";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "salt";--> statement-breakpoint
ALTER TABLE "public"."userChanges" ALTER COLUMN "changedColumn" SET DATA TYPE text;--> statement-breakpoint
-- DROP TYPE "public"."trackedUserColumnName";--> statement-breakpoint
CREATE TYPE "public"."trackedUserColumnName" AS ENUM('username', 'email', 'password', 'userRole');--> statement-breakpoint
ALTER TABLE "public"."userChanges" ALTER COLUMN "changedColumn" SET DATA TYPE "public"."trackedUserColumnName" USING "changedColumn"::"public"."trackedUserColumnName";