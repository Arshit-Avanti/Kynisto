CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text,
	`user_id` text,
	`event_type` text NOT NULL,
	`metadata` text,
	`ip_hash` text,
	`occurred_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `analytics_store_type_date_idx` ON `analytics_events` (`store_id`,`event_type`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `analytics_date_idx` ON `analytics_events` (`occurred_at`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`metadata` text,
	`ip_hash` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_actor_date_idx` ON `audit_logs` (`actor_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`icon` text,
	`color` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE INDEX `categories_parent_status_idx` ON `categories` (`parent_id`,`status`);--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`store_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `favorites_user_store_unique` ON `favorites` (`user_id`,`store_id`);--> statement-breakpoint
CREATE INDEX `favorites_user_created_idx` ON `favorites` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `offers` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`code` text,
	`starts_at` integer,
	`ends_at` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `offers_store_status_dates_idx` ON `offers` (`store_id`,`status`,`ends_at`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`price` real,
	`currency` text DEFAULT 'INR' NOT NULL,
	`image_key` text,
	`image_url` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `products_store_status_idx` ON `products` (`store_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_store_slug_unique` ON `products` (`store_id`,`slug`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`window_started_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text,
	`review_id` text,
	`reporter_id` text,
	`reason` text NOT NULL,
	`details` text,
	`status` text DEFAULT 'open' NOT NULL,
	`assigned_to` text,
	`resolved_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`review_id`) REFERENCES `reviews`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `reports_status_created_idx` ON `reports` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`user_id` text,
	`reviewer_name` text NOT NULL,
	`rating` integer NOT NULL,
	`title` text,
	`comment` text NOT NULL,
	`owner_reply` text,
	`owner_replied_at` integer,
	`status` text DEFAULT 'published' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `reviews_store_status_created_idx` ON `reviews` (`store_id`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `reviews_user_idx` ON `reviews` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `reviews_store_user_unique` ON `reviews` (`store_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`price_from` real,
	`duration_minutes` integer,
	`image_key` text,
	`image_url` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `services_store_status_idx` ON `services` (`store_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `services_store_slug_unique` ON `services` (`store_id`,`slug`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`csrf_token_hash` text NOT NULL,
	`remember_me` integer DEFAULT false NOT NULL,
	`expires_at` integer NOT NULL,
	`last_seen_at` integer DEFAULT (unixepoch()) NOT NULL,
	`user_agent_hash` text,
	`ip_hash` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_hash_unique` ON `sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_expiry_idx` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `store_images` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`object_key` text NOT NULL,
	`url` text NOT NULL,
	`alt_text` text,
	`kind` text DEFAULT 'gallery' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`width` integer,
	`height` integer,
	`content_type` text,
	`size_bytes` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `store_images_store_kind_idx` ON `store_images` (`store_id`,`kind`);--> statement-breakpoint
CREATE UNIQUE INDEX `store_images_object_key_unique` ON `store_images` (`object_key`);--> statement-breakpoint
CREATE TABLE `stores` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text,
	`category_id` text NOT NULL,
	`subcategory_id` text,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`business_type` text DEFAULT 'Local business' NOT NULL,
	`address` text NOT NULL,
	`area` text NOT NULL,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`country` text DEFAULT 'India' NOT NULL,
	`postal_code` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`google_maps_url` text,
	`phone` text,
	`whatsapp` text,
	`email` text,
	`website` text,
	`business_hours` text NOT NULL,
	`opening_days` text NOT NULL,
	`logo_key` text,
	`logo_url` text,
	`banner_key` text,
	`banner_url` text,
	`rating_average` real DEFAULT 0 NOT NULL,
	`rating_count` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`rejection_reason` text,
	`approved_at` integer,
	`approved_by` text,
	`view_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`subcategory_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stores_slug_unique` ON `stores` (`slug`);--> statement-breakpoint
CREATE INDEX `stores_owner_idx` ON `stores` (`owner_id`);--> statement-breakpoint
CREATE INDEX `stores_category_status_idx` ON `stores` (`category_id`,`status`);--> statement-breakpoint
CREATE INDEX `stores_location_idx` ON `stores` (`city`,`area`,`postal_code`);--> statement-breakpoint
CREATE INDEX `stores_rating_idx` ON `stores` (`rating_average`);--> statement-breakpoint
CREATE INDEX `stores_created_idx` ON `stores` (`created_at`);--> statement-breakpoint
CREATE TABLE `system_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`password_salt` text NOT NULL,
	`password_iterations` integer DEFAULT 210000 NOT NULL,
	`role` text DEFAULT 'customer' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`avatar_url` text,
	`phone` text,
	`last_login_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_role_status_idx` ON `users` (`role`,`status`);--> statement-breakpoint
CREATE INDEX `users_created_at_idx` ON `users` (`created_at`);