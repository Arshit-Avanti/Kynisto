-- Healthcare Appointments & Doctors System
-- New: Doctors table (managed by clinic owner)
CREATE TABLE `healthcare_doctors` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`name` text NOT NULL,
	`specialization` text,
	`consultation_minutes` integer DEFAULT 15 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE INDEX `healthcare_doctors_store_idx` ON `healthcare_doctors` (`store_id`,`status`);--> statement-breakpoint
-- New: Appointments table
CREATE TABLE `healthcare_appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`user_id` text NOT NULL,
	`doctor_id` text,
	`appointment_date` text NOT NULL,
	`time_slot` text NOT NULL,
	`duration_minutes` integer DEFAULT 15 NOT NULL,
	`status` text DEFAULT 'booked' NOT NULL,
	`queue_entry_id` text,
	`patient_name` text,
	`patient_phone` text,
	`notes` text,
	`cancellation_reason` text,
	`rescheduled_from` text,
	`confirmed_at` integer,
	`checked_in_at` integer,
	`completed_at` integer,
	`cancelled_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`doctor_id`) REFERENCES `healthcare_doctors`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`queue_entry_id`) REFERENCES `healthcare_queue_entries`(`id`) ON UPDATE no action ON DELETE set null
);--> statement-breakpoint
CREATE INDEX `healthcare_appt_store_date_idx` ON `healthcare_appointments` (`store_id`,`appointment_date`,`status`);--> statement-breakpoint
CREATE INDEX `healthcare_appt_user_date_idx` ON `healthcare_appointments` (`user_id`,`appointment_date`);--> statement-breakpoint
CREATE INDEX `healthcare_appt_doctor_date_idx` ON `healthcare_appointments` (`doctor_id`,`appointment_date`,`status`);--> statement-breakpoint
-- Extend queue entries with appointment link, late details, and doctor
ALTER TABLE `healthcare_queue_entries` ADD `late_minutes` integer;--> statement-breakpoint
ALTER TABLE `healthcare_queue_entries` ADD `late_reported_at` integer;--> statement-breakpoint
ALTER TABLE `healthcare_queue_entries` ADD `appointment_id` text REFERENCES healthcare_appointments(id) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE `healthcare_queue_entries` ADD `doctor_id` text REFERENCES healthcare_doctors(id) ON DELETE SET NULL;--> statement-breakpoint
-- Extend queue settings with grace period
ALTER TABLE `healthcare_queue_settings` ADD `grace_period_minutes` integer DEFAULT 30 NOT NULL;
