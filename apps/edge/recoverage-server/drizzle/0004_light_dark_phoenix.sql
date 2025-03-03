ALTER TABLE `tokens` RENAME COLUMN "selector" TO "id";--> statement-breakpoint
ALTER TABLE `tokens` RENAME COLUMN "verifierHash" TO "name";--> statement-breakpoint
ALTER TABLE `tokens` ADD `hash` text NOT NULL;--> statement-breakpoint
ALTER TABLE `tokens` ADD `salt` text NOT NULL;