ALTER TABLE `beta_signups` ADD `phone` varchar(30);
--> statement-breakpoint
ALTER TABLE `beta_signups` ADD `intent` varchar(64) DEFAULT 'Pilot Spot Request';
