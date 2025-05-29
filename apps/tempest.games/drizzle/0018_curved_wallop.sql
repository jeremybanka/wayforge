ALTER TABLE "accountActions" ADD COLUMN "expiresAtIso" varchar(24);--> statement-breakpoint
UPDATE "accountActions"
SET "expiresAtIso" = TO_CHAR("expiresAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');--> statement-breakpoint
ALTER TABLE "accountActions" ALTER COLUMN "expiresAtIso" SET NOT NULL;

ALTER TABLE "banishedIps" ADD COLUMN "banishedAtIso" varchar(24);--> statement-breakpoint
UPDATE "banishedIps"
SET "banishedAtIso" = TO_CHAR("banishedAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');--> statement-breakpoint
ALTER TABLE "banishedIps" ALTER COLUMN "banishedAtIso" SET NOT NULL;

ALTER TABLE "banishedIps" ADD COLUMN "banishedUntilIso" varchar(24);--> statement-breakpoint
UPDATE "banishedIps"
SET "banishedUntilIso" = TO_CHAR("banishedUntil" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');--> statement-breakpoint

ALTER TABLE "passwordResetAttempts" ADD COLUMN "requestedAtIso" varchar(24);--> statement-breakpoint
UPDATE "passwordResetAttempts"
SET "requestedAtIso" = TO_CHAR("requestedAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');--> statement-breakpoint
ALTER TABLE "passwordResetAttempts" ALTER COLUMN "requestedAtIso" SET NOT NULL;

ALTER TABLE "passwordResetAttempts" ADD COLUMN "succeededAtIso" varchar(24);--> statement-breakpoint
UPDATE "passwordResetAttempts"
SET "succeededAtIso" = TO_CHAR("succeededAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');--> statement-breakpoint

ALTER TABLE "signInHistory" ADD COLUMN "signInTimeIso" varchar(24);--> statement-breakpoint
UPDATE "signInHistory"
SET "signInTimeIso" = TO_CHAR("signInTime" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');--> statement-breakpoint
ALTER TABLE "signInHistory" ALTER COLUMN "signInTimeIso" SET NOT NULL;

ALTER TABLE "users" ADD COLUMN "createdAtIso" varchar(24);--> statement-breakpoint
UPDATE "users"
SET "createdAtIso" = TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "createdAtIso" SET NOT NULL;

ALTER TABLE "users" ADD COLUMN "verifiedAtIso" varchar(24);
UPDATE "users"
SET "verifiedAtIso" = TO_CHAR("verifiedAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');--> statement-breakpoint
