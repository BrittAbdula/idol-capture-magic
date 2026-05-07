CREATE TABLE `binder_items` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`generation_id` text NOT NULL,
	`custom_caption` text,
	`position` integer DEFAULT 0 NOT NULL,
	`added_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`generation_id`) REFERENCES `generations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`group_id` text NOT NULL,
	`title` text NOT NULL,
	`release_date` text NOT NULL,
	`status` text NOT NULL,
	`concept_keywords` text NOT NULL,
	`concept_palette` text NOT NULL,
	`hero_image` text,
	`description` text,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `campaigns_slug_unique` ON `campaigns` (`slug`);--> statement-breakpoint
CREATE TABLE `concepts` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`format` text NOT NULL,
	`category` text,
	`campaign_id` text,
	`prompt_template` text NOT NULL,
	`style_tokens` text NOT NULL,
	`sample_output_url` text NOT NULL,
	`premium` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `concepts_slug_unique` ON `concepts` (`slug`);--> statement-breakpoint
CREATE TABLE `generations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`concept_id` text NOT NULL,
	`member_id` text NOT NULL,
	`format` text NOT NULL,
	`status` text NOT NULL,
	`input_image_ref` text,
	`output_image_ref` text,
	`error_message` text,
	`cost` real,
	`watermark_level` text NOT NULL,
	`is_public` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`concept_id`) REFERENCES `concepts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `groups` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`name_ko` text,
	`name_ja` text,
	`agency` text,
	`debut_date` text,
	`theme_color` text DEFAULT '#FFFFFF' NOT NULL,
	`cover_image` text,
	`popularity_rank` integer DEFAULT 999 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `groups_slug_unique` ON `groups` (`slug`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`name_ko` text,
	`name_ja` text,
	`position` text,
	`birthday` text,
	`silhouette_image` text NOT NULL,
	`todo_licensed_asset` integer DEFAULT true NOT NULL,
	`facts` text,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`handle` text NOT NULL,
	`google_id` text,
	`bias_group_id` text,
	`bias_member_id` text,
	`locale` text DEFAULT 'en' NOT NULL,
	`plan` text DEFAULT 'free' NOT NULL,
	`stripe_customer_id` text,
	`stripe_subscription_id` text,
	`plan_renews_at` integer,
	`daily_quota_used` integer DEFAULT 0 NOT NULL,
	`daily_quota_reset_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_handle_unique` ON `users` (`handle`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_google_id_unique` ON `users` (`google_id`);