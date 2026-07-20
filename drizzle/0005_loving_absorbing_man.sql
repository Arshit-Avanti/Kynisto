ALTER TABLE `healthcare_queue_entries` ADD `is_walk_in` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `healthcare_queue_entries` ADD `patient_name` text;--> statement-breakpoint
ALTER TABLE `healthcare_queue_entries` ADD `contact_details` text;--> statement-breakpoint
ALTER TABLE `healthcare_queue_entries` ADD `expires_at` integer;--> statement-breakpoint
ALTER TABLE `healthcare_queue_entries` ADD `reminder_sent_at` integer;--> statement-breakpoint
CREATE INDEX `healthcare_queue_expiry_idx` ON `healthcare_queue_entries` (`expires_at`,`status`);--> statement-breakpoint
UPDATE healthcare_queue_entries
SET status = 'cancelled', active_key = NULL, left_at = unixepoch(), updated_at = unixepoch()
WHERE active_key IS NOT NULL;--> statement-breakpoint
UPDATE healthcare_queue_entries
SET expires_at = joined_at + 10800
WHERE expires_at IS NULL;
