CREATE TABLE `billing_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`event_type` text NOT NULL,
	`plan` text,
	`billing_cycle` text,
	`stripe_customer_id` text,
	`stripe_subscription_id` text,
	`stripe_checkout_session_id` text,
	`error_code` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
