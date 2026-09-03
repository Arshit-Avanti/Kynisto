-- Healthcare Prescriptions & Follow-ups System
CREATE TABLE `healthcare_prescription_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`name` text NOT NULL,
	`is_default` integer DEFAULT 1 NOT NULL,
	`layout_json` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE INDEX `healthcare_template_store_idx` ON `healthcare_prescription_templates` (`store_id`,`is_default`);--> statement-breakpoint
CREATE TABLE `healthcare_prescriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`prescription_number` text NOT NULL,
	`store_id` text NOT NULL,
	`doctor_id` text,
	`doctor_name` text NOT NULL,
	`doctor_specialization` text,
	`store_name` text NOT NULL,
	`user_id` text,
	`patient_name` text NOT NULL,
	`patient_phone` text,
	`patient_age` integer,
	`patient_gender` text,
	`patient_address` text,
	`queue_entry_id` text,
	`appointment_id` text,
	`vitals_json` text,
	`symptoms` text,
	`diagnosis` text,
	`medicines_json` text NOT NULL,
	`tests_json` text,
	`advice` text,
	`template_snapshot_json` text NOT NULL,
	`status` text DEFAULT 'issued' NOT NULL,
	`superseded_by_id` text,
	`original_prescription_id` text,
	`correction_reason` text,
	`issued_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`doctor_id`) REFERENCES `healthcare_doctors`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`queue_entry_id`) REFERENCES `healthcare_queue_entries`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`appointment_id`) REFERENCES `healthcare_appointments`(`id`) ON UPDATE no action ON DELETE set null
);--> statement-breakpoint
CREATE UNIQUE INDEX `healthcare_prescription_number_idx` ON `healthcare_prescriptions` (`prescription_number`);--> statement-breakpoint
CREATE INDEX `healthcare_rx_store_date_idx` ON `healthcare_prescriptions` (`store_id`,`issued_at`,`status`);--> statement-breakpoint
CREATE INDEX `healthcare_rx_user_date_idx` ON `healthcare_prescriptions` (`user_id`,`issued_at`);--> statement-breakpoint
CREATE INDEX `healthcare_rx_phone_idx` ON `healthcare_prescriptions` (`patient_phone`,`issued_at`);--> statement-breakpoint
CREATE TABLE `healthcare_follow_ups` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`prescription_id` text NOT NULL,
	`user_id` text,
	`patient_name` text NOT NULL,
	`patient_phone` text,
	`doctor_id` text,
	`doctor_name` text NOT NULL,
	`original_consultation_date` text NOT NULL,
	`follow_up_date` text NOT NULL,
	`valid_until_date` text NOT NULL,
	`validity_days` integer NOT NULL,
	`follow_up_type` text DEFAULT 'free' NOT NULL,
	`follow_up_fee` real DEFAULT 0 NOT NULL,
	`payment_status` text DEFAULT 'free' NOT NULL,
	`booking_status` text DEFAULT 'not_booked' NOT NULL,
	`appointment_id` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`prescription_id`) REFERENCES `healthcare_prescriptions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`doctor_id`) REFERENCES `healthcare_doctors`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`appointment_id`) REFERENCES `healthcare_appointments`(`id`) ON UPDATE no action ON DELETE set null
);--> statement-breakpoint
CREATE INDEX `healthcare_followup_store_date_idx` ON `healthcare_follow_ups` (`store_id`,`follow_up_date`,`booking_status`);--> statement-breakpoint
CREATE INDEX `healthcare_followup_user_idx` ON `healthcare_follow_ups` (`user_id`,`follow_up_date`);--> statement-breakpoint
CREATE INDEX `healthcare_followup_rx_idx` ON `healthcare_follow_ups` (`prescription_id`);--> statement-breakpoint
ALTER TABLE `healthcare_queue_settings` ADD `default_followup_type` text DEFAULT 'free';--> statement-breakpoint
ALTER TABLE `healthcare_queue_settings` ADD `default_followup_validity_days` integer DEFAULT 7;--> statement-breakpoint
ALTER TABLE `healthcare_queue_settings` ADD `default_followup_fee` real DEFAULT 0;
