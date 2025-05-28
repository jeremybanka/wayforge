ALTER TABLE "accountActions" DROP COLUMN "expiresAt";--> statement-breakpoint
ALTER TABLE "banishedIps" DROP COLUMN "banishedAt";--> statement-breakpoint
ALTER TABLE "banishedIps" DROP COLUMN "banishedUntil";--> statement-breakpoint
ALTER TABLE "passwordResetAttempts" DROP COLUMN "requestedAt";--> statement-breakpoint
ALTER TABLE "passwordResetAttempts" DROP COLUMN "succeededAt";--> statement-breakpoint
ALTER TABLE "signInHistory" DROP COLUMN "signInTime";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "verifiedAt";