CREATE TABLE `chat_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`message_id` text,
	`reporter_id` text,
	`reported_id` text,
	`reason` text NOT NULL,
	`details` text,
	`status` text DEFAULT 'open' NOT NULL,
	`assigned_to` text,
	`resolved_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`reported_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `chat_reports_status_date_idx` ON `chat_reports` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `conversation_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`blocker_id` text NOT NULL,
	`blocked_id` text NOT NULL,
	`reason` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`blocker_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`blocked_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `conversation_block_unique` ON `conversation_blocks` (`conversation_id`,`blocker_id`,`blocked_id`);--> statement-breakpoint
CREATE INDEX `conversation_blocks_users_idx` ON `conversation_blocks` (`blocker_id`,`blocked_id`);--> statement-breakpoint
CREATE TABLE `conversation_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`user_id` text NOT NULL,
	`participant_role` text NOT NULL,
	`last_read_at` integer,
	`muted_at` integer,
	`joined_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `conversation_participant_unique` ON `conversation_participants` (`conversation_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `conversation_participants_user_idx` ON `conversation_participants` (`user_id`,`conversation_id`);--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`store_id` text,
	`support_ticket_id` text,
	`subject` text DEFAULT 'Conversation' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_by` text,
	`last_message_at` integer DEFAULT (unixepoch()) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`support_ticket_id`) REFERENCES `support_tickets`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `conversations_kind_status_date_idx` ON `conversations` (`kind`,`status`,`last_message_at`);--> statement-breakpoint
CREATE INDEX `conversations_store_date_idx` ON `conversations` (`store_id`,`last_message_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `conversations_support_ticket_unique` ON `conversations` (`support_ticket_id`);--> statement-breakpoint
CREATE TABLE `healthcare_provider_profiles` (
	`store_id` text PRIMARY KEY NOT NULL,
	`provider_type` text NOT NULL,
	`accepting_patients` integer DEFAULT true NOT NULL,
	`emergency_available` integer DEFAULT false NOT NULL,
	`admin_queue_enabled` integer DEFAULT false NOT NULL,
	`owner_queue_enabled` integer DEFAULT false NOT NULL,
	`verification_status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `healthcare_profiles_type_queue_idx` ON `healthcare_provider_profiles` (`provider_type`,`admin_queue_enabled`,`owner_queue_enabled`);--> statement-breakpoint
CREATE TABLE `healthcare_queue_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`user_id` text NOT NULL,
	`service_date` text NOT NULL,
	`token_number` integer NOT NULL,
	`active_key` text,
	`status` text DEFAULT 'waiting' NOT NULL,
	`joined_at` integer DEFAULT (unixepoch()) NOT NULL,
	`called_at` integer,
	`completed_at` integer,
	`left_at` integer,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `healthcare_queue_token_unique` ON `healthcare_queue_entries` (`store_id`,`service_date`,`token_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `healthcare_queue_active_unique` ON `healthcare_queue_entries` (`active_key`);--> statement-breakpoint
CREATE INDEX `healthcare_queue_store_status_token_idx` ON `healthcare_queue_entries` (`store_id`,`service_date`,`status`,`token_number`);--> statement-breakpoint
CREATE INDEX `healthcare_queue_user_date_idx` ON `healthcare_queue_entries` (`user_id`,`service_date`);--> statement-breakpoint
CREATE TABLE `healthcare_queue_events` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`entry_id` text,
	`actor_id` text,
	`event_type` text NOT NULL,
	`metadata` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`entry_id`) REFERENCES `healthcare_queue_entries`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `healthcare_queue_events_store_date_idx` ON `healthcare_queue_events` (`store_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `healthcare_queue_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`entry_id` text,
	`reporter_id` text,
	`reason` text NOT NULL,
	`details` text,
	`status` text DEFAULT 'open' NOT NULL,
	`assigned_to` text,
	`resolved_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`entry_id`) REFERENCES `healthcare_queue_entries`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `healthcare_queue_reports_status_date_idx` ON `healthcare_queue_reports` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `healthcare_queue_settings` (
	`store_id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'closed' NOT NULL,
	`consultation_minutes` integer DEFAULT 15 NOT NULL,
	`current_token_number` integer DEFAULT 0 NOT NULL,
	`next_token_number` integer DEFAULT 1 NOT NULL,
	`service_date` text NOT NULL,
	`opened_at` integer,
	`closed_at` integer,
	`updated_by` text,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`type` text DEFAULT 'text' NOT NULL,
	`body` text NOT NULL,
	`client_nonce` text,
	`delivered_at` integer DEFAULT (unixepoch()) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `messages_conversation_date_idx` ON `messages` (`conversation_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `messages_sender_nonce_unique` ON `messages` (`sender_id`,`client_nonce`);--> statement-breakpoint
ALTER TABLE `categories` ADD `module` text DEFAULT 'local' NOT NULL;--> statement-breakpoint
CREATE INDEX `categories_module_status_idx` ON `categories` (`module`,`status`);