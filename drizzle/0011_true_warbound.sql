CREATE TABLE `beta_nurture_emails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`betaSignupId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(255) NOT NULL,
	`trade` varchar(64),
	`spotNumber` int NOT NULL,
	`emailKey` enum('day1_activation','day3_social_proof','day7_roi','day14_urgency') NOT NULL,
	`scheduledAt` bigint NOT NULL,
	`sentAt` bigint,
	`status` enum('scheduled','sent','failed','cancelled') NOT NULL DEFAULT 'scheduled',
	`brevoMessageId` varchar(255),
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `beta_nurture_emails_id` PRIMARY KEY(`id`)
);
