CREATE TABLE `addresses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`label` text DEFAULT 'Home' NOT NULL,
	`recipient_name` text NOT NULL,
	`phone` text NOT NULL,
	`line1` text NOT NULL,
	`line2` text,
	`area` text NOT NULL,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`country` text DEFAULT 'India' NOT NULL,
	`postal_code` text NOT NULL,
	`latitude` real,
	`longitude` real,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `addresses_user_idx` ON `addresses` (`user_id`,`is_default`);--> statement-breakpoint
CREATE INDEX `addresses_postal_idx` ON `addresses` (`postal_code`);--> statement-breakpoint
CREATE TABLE `banners` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`subtitle` text,
	`image_key` text,
	`image_url` text,
	`link_url` text,
	`placement` text DEFAULT 'home' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`starts_at` integer,
	`ends_at` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `banners_placement_status_dates_idx` ON `banners` (`placement`,`status`,`starts_at`,`ends_at`);--> statement-breakpoint
CREATE TABLE `cart_items` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cart_user_product_unique` ON `cart_items` (`user_id`,`product_id`);--> statement-breakpoint
CREATE INDEX `cart_user_updated_idx` ON `cart_items` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `coupon_redemptions` (
	`id` text PRIMARY KEY NOT NULL,
	`coupon_id` text NOT NULL,
	`user_id` text NOT NULL,
	`order_id` text NOT NULL,
	`discount_amount` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coupon_redemptions_order_unique` ON `coupon_redemptions` (`order_id`);--> statement-breakpoint
CREATE INDEX `coupon_redemptions_coupon_user_idx` ON `coupon_redemptions` (`coupon_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`discount_type` text NOT NULL,
	`discount_value` real NOT NULL,
	`minimum_order` real DEFAULT 0 NOT NULL,
	`maximum_discount` real,
	`usage_limit` integer,
	`used_count` integer DEFAULT 0 NOT NULL,
	`starts_at` integer,
	`ends_at` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coupons_code_unique` ON `coupons` (`code`);--> statement-breakpoint
CREATE INDEX `coupons_store_status_dates_idx` ON `coupons` (`store_id`,`status`,`ends_at`);--> statement-breakpoint
CREATE TABLE `inventory` (
	`product_id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`sku` text NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	`reserved_quantity` integer DEFAULT 0 NOT NULL,
	`low_stock_threshold` integer DEFAULT 5 NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_store_sku_unique` ON `inventory` (`store_id`,`sku`);--> statement-breakpoint
CREATE INDEX `inventory_store_quantity_idx` ON `inventory` (`store_id`,`quantity`);--> statement-breakpoint
CREATE TABLE `inventory_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`store_id` text NOT NULL,
	`actor_id` text,
	`quantity_change` integer NOT NULL,
	`reason` text NOT NULL,
	`reference_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `inventory_movements_store_date_idx` ON `inventory_movements` (`store_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`audience` text DEFAULT 'user' NOT NULL,
	`type` text DEFAULT 'info' NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`link` text,
	`read_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notifications_user_read_date_idx` ON `notifications` (`user_id`,`read_at`,`created_at`);--> statement-breakpoint
CREATE INDEX `notifications_audience_date_idx` ON `notifications` (`audience`,`created_at`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text,
	`product_name` text NOT NULL,
	`sku` text,
	`unit_price` real NOT NULL,
	`quantity` integer NOT NULL,
	`line_total` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE TABLE `order_status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`actor_id` text,
	`status` text NOT NULL,
	`note` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `order_history_order_date_idx` ON `order_status_history` (`order_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`order_number` text NOT NULL,
	`user_id` text NOT NULL,
	`store_id` text NOT NULL,
	`coupon_id` text,
	`address_snapshot` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`fulfillment_type` text DEFAULT 'delivery' NOT NULL,
	`subtotal` real NOT NULL,
	`discount` real DEFAULT 0 NOT NULL,
	`delivery_fee` real DEFAULT 0 NOT NULL,
	`total` real NOT NULL,
	`currency` text DEFAULT 'INR' NOT NULL,
	`notes` text,
	`placed_at` integer DEFAULT (unixepoch()) NOT NULL,
	`cancelled_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_number_unique` ON `orders` (`order_number`);--> statement-breakpoint
CREATE INDEX `orders_user_status_date_idx` ON `orders` (`user_id`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `orders_store_status_date_idx` ON `orders` (`store_id`,`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `store_settings` (
	`store_id` text PRIMARY KEY NOT NULL,
	`accepting_orders` integer DEFAULT true NOT NULL,
	`pickup_enabled` integer DEFAULT true NOT NULL,
	`delivery_enabled` integer DEFAULT true NOT NULL,
	`minimum_order` real DEFAULT 0 NOT NULL,
	`delivery_fee` real DEFAULT 0 NOT NULL,
	`delivery_radius_km` real DEFAULT 5 NOT NULL,
	`auto_accept_orders` integer DEFAULT false NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `support_tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`store_id` text,
	`order_id` text,
	`assigned_to` text,
	`type` text DEFAULT 'support' NOT NULL,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`resolution` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `support_status_priority_date_idx` ON `support_tickets` (`status`,`priority`,`created_at`);--> statement-breakpoint
CREATE INDEX `support_user_date_idx` ON `support_tickets` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email_notifications` integer DEFAULT true NOT NULL,
	`order_notifications` integer DEFAULT true NOT NULL,
	`marketing_notifications` integer DEFAULT false NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_security` (
	`user_id` text PRIMARY KEY NOT NULL,
	`must_change_password` integer DEFAULT false NOT NULL,
	`is_super_admin` integer DEFAULT false NOT NULL,
	`failed_login_count` integer DEFAULT 0 NOT NULL,
	`last_failed_login_at` integer,
	`locked_until` integer,
	`password_changed_at` integer,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_security_locked_idx` ON `user_security` (`locked_until`);--> statement-breakpoint
CREATE TABLE `wishlist_items` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`product_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wishlist_user_product_unique` ON `wishlist_items` (`user_id`,`product_id`);--> statement-breakpoint
CREATE INDEX `wishlist_user_date_idx` ON `wishlist_items` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TRIGGER `inventory_prevent_negative`
BEFORE UPDATE OF `quantity` ON `inventory`
FOR EACH ROW WHEN NEW.`quantity` < 0
BEGIN
	SELECT RAISE(ABORT, 'Insufficient inventory');
END;
