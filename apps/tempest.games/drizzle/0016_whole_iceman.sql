ALTER TABLE "userTokens" RENAME TO "accountActions";--> statement-breakpoint
ALTER TABLE "accountActions" DROP CONSTRAINT "userTokens_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "accountActions" ADD CONSTRAINT "accountActions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;