ALTER TABLE "loginHistory" ALTER COLUMN "userId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "loginHistory" ALTER COLUMN "successful" SET DEFAULT false;