ALTER TABLE "loginHistory" RENAME TO "signInHistory";--> statement-breakpoint
ALTER TABLE "signInHistory" RENAME COLUMN "loginTime" TO "signInTime";--> statement-breakpoint
ALTER TABLE "signInHistory" DROP CONSTRAINT "loginHistory_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "accountActions" ALTER COLUMN "action" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."accountAction";--> statement-breakpoint
CREATE TYPE "public"."accountAction" AS ENUM('cooldown', 'confirmEmail', 'signIn', 'resetPassword');--> statement-breakpoint
ALTER TABLE "accountActions" ALTER COLUMN "action" SET DATA TYPE "public"."accountAction" USING "action"::"public"."accountAction";--> statement-breakpoint
ALTER TABLE "signInHistory" ADD CONSTRAINT "signInHistory_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;