CREATE TABLE `stitch_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`user_email` text NOT NULL,
	`pattern_id` text NOT NULL,
	`pattern_json` text NOT NULL,
	`stitched_json` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stitch_progress_user_pattern_idx` ON `stitch_progress` (`user_email`,`pattern_id`);