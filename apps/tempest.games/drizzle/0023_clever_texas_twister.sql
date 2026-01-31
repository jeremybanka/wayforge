CREATE TYPE "public"."meal" AS ENUM('breakfast', 'brunch', 'lunch', 'tea', 'dinner', 'supper');--> statement-breakpoint
CREATE TABLE "foodItem" (
	"userId" uuid,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"day" integer NOT NULL,
	"meal" "meal" NOT NULL,
	"name" varchar(254) NOT NULL,
	"carbs" integer NOT NULL,
	"protein" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "foodItem" ADD CONSTRAINT "foodItem_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;