CREATE TABLE `oauth_onboarding` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`provider_user_id` text NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`avatar_url` text,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `oauth_onboarding_token_unique` ON `oauth_onboarding` (`token_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `oauth_onboarding_provider_user_unique` ON `oauth_onboarding` (`provider_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `oauth_onboarding_email_unique` ON `oauth_onboarding` (`email`);--> statement-breakpoint
CREATE INDEX `oauth_onboarding_expiry_idx` ON `oauth_onboarding` (`expires_at`);