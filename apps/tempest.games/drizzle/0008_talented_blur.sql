DROP INDEX IF EXISTS "users_username_index";--> statement-breakpoint
DROP INDEX IF EXISTS "users_email_index";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "usernameUniqueIndex" ON "users" USING btree (lower("username"));--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "emailUniqueIndex" ON "users" USING btree (lower("email"));