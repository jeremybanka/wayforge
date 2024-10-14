ALTER TABLE "banishedIps" ALTER COLUMN "banishedAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "banishedIps" ALTER COLUMN "banishedUntil" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "loginHistory" ALTER COLUMN "loginTime" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "passwordResetAttempts" ALTER COLUMN "requestedAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "passwordResetAttempts" ALTER COLUMN "succeededAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "userChanges" ALTER COLUMN "changedAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "verifiedAt" SET DATA TYPE timestamp with time zone;