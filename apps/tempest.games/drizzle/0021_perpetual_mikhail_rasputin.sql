CREATE TABLE "userSessions" (
	"userId" uuid NOT NULL,
	"sessionKey" uuid NOT NULL,
	"createdAtIso" varchar(24) DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') NOT NULL
);
--> statement-breakpoint
ALTER TABLE "banishedIps" ALTER COLUMN "banishedAtIso" SET DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');--> statement-breakpoint
ALTER TABLE "passwordResetAttempts" ALTER COLUMN "requestedAtIso" SET DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');--> statement-breakpoint
ALTER TABLE "signInHistory" ALTER COLUMN "signInTimeIso" SET DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "createdAtIso" SET DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');--> statement-breakpoint
ALTER TABLE "userSessions" ADD CONSTRAINT "userSessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;