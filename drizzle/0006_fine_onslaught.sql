CREATE TABLE `media_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`object_key` text NOT NULL,
	`thumbnail_key` text,
	`public_url` text,
	`thumbnail_url` text,
	`owner_type` text NOT NULL,
	`product_id` text,
	`service_id` text,
	`message_id` text,
	`store_id` text,
	`conversation_id` text,
	`uploaded_by` text NOT NULL,
	`media_type` text NOT NULL,
	`content_type` text NOT NULL,
	`original_name` text NOT NULL,
	`caption` text,
	`alt_text` text,
	`size_bytes` integer NOT NULL,
	`checksum` text NOT NULL,
	`width` integer,
	`height` integer,
	`duration_seconds` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`crop_x` integer DEFAULT 50 NOT NULL,
	`crop_y` integer DEFAULT 50 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_assets_object_key_unique` ON `media_assets` (`object_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `media_assets_message_unique` ON `media_assets` (`message_id`);--> statement-breakpoint
CREATE INDEX `media_assets_product_order_idx` ON `media_assets` (`product_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `media_assets_service_order_idx` ON `media_assets` (`service_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `media_assets_conversation_date_idx` ON `media_assets` (`conversation_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `media_assets_uploaded_checksum_idx` ON `media_assets` (`uploaded_by`,`checksum`);