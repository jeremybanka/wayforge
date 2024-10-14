ALTER TABLE "banished_ips" RENAME TO "banishedIps";--> statement-breakpoint
ALTER TABLE "login_history" RENAME TO "loginHistory";--> statement-breakpoint
ALTER TABLE "password_reset_attempts" RENAME TO "passwordResetAttempts";--> statement-breakpoint
ALTER TABLE "user_changes" RENAME TO "userChanges";--> statement-breakpoint
ALTER TABLE "loginHistory" DROP CONSTRAINT "login_history_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "passwordResetAttempts" DROP CONSTRAINT "password_reset_attempts_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "userChanges" DROP CONSTRAINT "user_changes_userId_users_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "users_username_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "users_email_unique";--> statement-breakpoint
ALTER TABLE "banishedIps" ALTER COLUMN "banishedUntil" DROP NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loginHistory" ADD CONSTRAINT "loginHistory_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "passwordResetAttempts" ADD CONSTRAINT "passwordResetAttempts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userChanges" ADD CONSTRAINT "userChanges_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_index" ON "users" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_index" ON "users" USING btree ("email");