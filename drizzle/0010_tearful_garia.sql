CREATE TABLE `beta_signups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`company` varchar(255),
	`trade` varchar(64),
	`state` enum('NSW','VIC','QLD','SA','WA','TAS','NT','ACT'),
	`projectSize` enum('sole_trader','small_builder','mid_tier','enterprise'),
	`source` varchar(64) DEFAULT 'website',
	`utmCampaign` varchar(128),
	`feedback` text,
	`status` enum('pending','approved','active','churned') NOT NULL DEFAULT 'pending',
	`userId` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `beta_signups_id` PRIMARY KEY(`id`),
	CONSTRAINT `beta_signups_email_unique` UNIQUE(`email`)
);
