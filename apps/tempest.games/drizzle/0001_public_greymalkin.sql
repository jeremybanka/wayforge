DO $$ BEGIN
 CREATE TYPE "public"."role" AS ENUM('admin', 'user');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."tracked_user_columnName" AS ENUM('username', 'email', 'hash', 'userRole');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."two_factor_method" AS ENUM('email', 'phone');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "banished_ips" (
	"ip" varchar(45) NOT NULL,
	"reason" varchar(2048) NOT NULL,
	"banishedAt" timestamp DEFAULT now() NOT NULL,
	"banishedUntil" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "login_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"loginTime" timestamp DEFAULT now() NOT NULL,
	"ipAddress" varchar(45) NOT NULL,
	"userAgent" varchar(1024),
	"geoLocation" varchar(255),
	"successful" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "password_reset_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"requestedIp" varchar(45) NOT NULL,
	"requestedAt" timestamp DEFAULT now() NOT NULL,
	"succeededIp" varchar(45),
	"succeededAt" timestamp,
	"verificationMethod" "two_factor_method" NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"changedAt" timestamp DEFAULT now() NOT NULL,
	"changedIp" varchar(45) NOT NULL,
	"changedColumn" "tracked_user_columnName" NOT NULL,
	"oldValue" varchar(255),
	"newValue" varchar(255)
);
--> statement-breakpoint
ALTER TABLE "players" RENAME COLUMN "user_id" TO "userId";--> statement-breakpoint
ALTER TABLE "players" RENAME COLUMN "game_id" TO "gameId";--> statement-breakpoint
ALTER TABLE "players" DROP CONSTRAINT "players_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "players" DROP CONSTRAINT "players_game_id_games_id_fk";
--> statement-breakpoint
ALTER TABLE "players" DROP CONSTRAINT "players_user_id_game_id_pk";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "username" SET DATA TYPE varchar(16);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE varchar(254);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "hash" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "salt" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_userId_gameId_pk" PRIMARY KEY("userId","gameId");--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "createdIp" varchar(45);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "isActive" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verifiedAt" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "userRole" "role" DEFAULT 'user';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "login_history" ADD CONSTRAINT "login_history_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "password_reset_attempts" ADD CONSTRAINT "password_reset_attempts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_changes" ADD CONSTRAINT "user_changes_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "players" ADD CONSTRAINT "players_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "players" ADD CONSTRAINT "players_gameId_games_id_fk" FOREIGN KEY ("gameId") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
