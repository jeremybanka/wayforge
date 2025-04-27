ALTER TABLE "userTokens" RENAME COLUMN "token" TO "code";--> statement-breakpoint
ALTER TABLE "userTokens" RENAME COLUMN "wrongTokenCount" TO "wrongCodeCount";--> statement-breakpoint
ALTER TABLE "userTokens" ALTER COLUMN "action" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."accountAction";--> statement-breakpoint
CREATE TYPE "public"."accountAction" AS ENUM('cooldown', 'confirmEmail', 'login', 'resetPassword');--> statement-breakpoint
ALTER TABLE "userTokens" ALTER COLUMN "action" SET DATA TYPE "public"."accountAction" USING "action"::"public"."accountAction";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;