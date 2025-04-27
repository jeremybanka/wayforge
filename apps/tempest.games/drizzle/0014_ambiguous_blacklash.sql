ALTER TYPE "public"."accountAction" ADD VALUE 'cooldown';--> statement-breakpoint
ALTER TABLE "userTokens" ALTER COLUMN "token" SET DATA TYPE varchar(254);