CREATE TYPE "public"."accountAction" AS ENUM('emailConfirm', 'passwordReset', 'emailChange');--> statement-breakpoint
CREATE TABLE "userTokens" (
	"userId" uuid PRIMARY KEY NOT NULL,
	"action" "accountAction" NOT NULL,
	"token" varchar(255) NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "userChanges" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "userChanges" CASCADE;--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "email" TO "emailOffered";--> statement-breakpoint
DROP INDEX "emailUniqueIndex";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emailVerified" varchar(254);--> statement-breakpoint
ALTER TABLE "userTokens" ADD CONSTRAINT "userTokens_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "emailVerifiedUniqueIndex" ON "users" USING btree (lower("emailVerified"));--> statement-breakpoint
DROP TYPE "public"."trackedUserColumnName";--> statement-breakpoint
CREATE TYPE "public"."trackedUserColumnName" AS ENUM('username', 'emailOffered', 'emailVerified', 'password', 'userRole');