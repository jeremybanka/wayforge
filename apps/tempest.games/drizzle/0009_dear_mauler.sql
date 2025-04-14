ALTER TABLE "loginHistory" DROP CONSTRAINT "loginHistory_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "passwordResetAttempts" DROP CONSTRAINT "passwordResetAttempts_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "players" DROP CONSTRAINT "players_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "players" DROP CONSTRAINT "players_gameId_games_id_fk";
--> statement-breakpoint
ALTER TABLE "userChanges" DROP CONSTRAINT "userChanges_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "loginHistory" ADD CONSTRAINT "loginHistory_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passwordResetAttempts" ADD CONSTRAINT "passwordResetAttempts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_gameId_games_id_fk" FOREIGN KEY ("gameId") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userChanges" ADD CONSTRAINT "userChanges_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

DELETE FROM "users";