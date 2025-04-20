ALTER TABLE "userTokens" ALTER COLUMN "token" SET DATA TYPE varchar(7);--> statement-breakpoint
ALTER TABLE "userTokens" ADD COLUMN "wrongTokenCount" integer DEFAULT 0 NOT NULL;