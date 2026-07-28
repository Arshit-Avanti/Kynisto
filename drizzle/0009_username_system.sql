ALTER TABLE `users` ADD COLUMN `username` text;
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);
--> statement-breakpoint
CREATE TABLE `username_counters` (
	`prefix` text PRIMARY KEY NOT NULL,
	`last_number` integer NOT NULL DEFAULT 1000
);
--> statement-breakpoint
INSERT INTO `username_counters` (`prefix`, `last_number`) VALUES ('kynshop', 1000);
--> statement-breakpoint
INSERT INTO `username_counters` (`prefix`, `last_number`) VALUES ('kyncus', 1000);
