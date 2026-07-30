CREATE TABLE `shared_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`sender_name` text NOT NULL,
	`recipient_email` text NOT NULL,
	`pattern_json` text NOT NULL,
	`created_at` integer NOT NULL
);
