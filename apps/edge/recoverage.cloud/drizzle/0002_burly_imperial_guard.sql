PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_reports` (
	`ref` text NOT NULL,
	`projectId` text NOT NULL,
	`data` text NOT NULL,
	`createdAt` text DEFAULT (current_timestamp) NOT NULL,
	PRIMARY KEY(`projectId`, `ref`),
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_reports`("ref", "projectId", "data", "createdAt") SELECT "ref", "projectId", "data", "createdAt" FROM `reports`;--> statement-breakpoint
DROP TABLE `reports`;--> statement-breakpoint
ALTER TABLE `__new_reports` RENAME TO `reports`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `users` ADD `role` text DEFAULT 'free' NOT NULL;