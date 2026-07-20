ALTER TABLE `healthcare_provider_profiles` ADD `queue_activation_status` text DEFAULT 'not_requested' NOT NULL;--> statement-breakpoint
ALTER TABLE `healthcare_provider_profiles` ADD `queue_requested_at` integer;--> statement-breakpoint
ALTER TABLE `healthcare_provider_profiles` ADD `queue_reviewed_at` integer;--> statement-breakpoint
ALTER TABLE `healthcare_provider_profiles` ADD `queue_reviewed_by` text REFERENCES users(id) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE `healthcare_provider_profiles` ADD `queue_decision_reason` text;--> statement-breakpoint
ALTER TABLE `healthcare_queue_entries` ADD `arrival_status` text DEFAULT 'waiting' NOT NULL;--> statement-breakpoint
ALTER TABLE `healthcare_queue_entries` ADD `is_emergency` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `healthcare_queue_entries` ADD `emergency_patient_name` text;--> statement-breakpoint
ALTER TABLE `healthcare_queue_entries` ADD `emergency_patient_phone` text;--> statement-breakpoint
ALTER TABLE `healthcare_queue_entries` ADD `recalled_at` integer;--> statement-breakpoint
ALTER TABLE `healthcare_queue_entries` ADD `recall_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `healthcare_queue_settings` ADD `opening_time` text DEFAULT '09:00' NOT NULL;--> statement-breakpoint
ALTER TABLE `healthcare_queue_settings` ADD `closing_time` text DEFAULT '18:00' NOT NULL;--> statement-breakpoint
ALTER TABLE `healthcare_queue_settings` ADD `maximum_daily_patients` integer DEFAULT 100 NOT NULL;--> statement-breakpoint
UPDATE `healthcare_provider_profiles` SET `admin_queue_enabled` = 0, `owner_queue_enabled` = 0, `queue_activation_status` = 'not_requested', `queue_requested_at` = NULL, `queue_reviewed_at` = NULL, `queue_reviewed_by` = NULL, `queue_decision_reason` = NULL;--> statement-breakpoint
UPDATE `healthcare_queue_settings` SET `status` = 'closed', `closed_at` = unixepoch(), `updated_at` = unixepoch();
