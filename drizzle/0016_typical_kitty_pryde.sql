CREATE TABLE `waitlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`trade` varchar(128) NOT NULL,
	`reason` text NOT NULL,
	`phone` varchar(20),
	`source` varchar(128) DEFAULT 'homepage',
	`utmSource` varchar(128),
	`utmCampaign` varchar(128),
	`waitlistStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`approvedAt` bigint,
	`confirmationSentAt` bigint,
	`hubspotContactId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `waitlist_id` PRIMARY KEY(`id`),
	CONSTRAINT `waitlist_email_unique` UNIQUE(`email`)
);
