CREATE TABLE `ad_engine_normalized_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` varchar(100) NOT NULL,
	`campaignId` varchar(100) NOT NULL,
	`campaignName` varchar(255),
	`adSetId` varchar(100) NOT NULL,
	`adSetName` varchar(255),
	`adId` varchar(100),
	`adName` varchar(255),
	`metricDate` date NOT NULL,
	`spend` decimal(12,2) NOT NULL DEFAULT '0.00',
	`impressions` int NOT NULL DEFAULT 0,
	`clicks` int NOT NULL DEFAULT 0,
	`conversions` decimal(12,2) NOT NULL DEFAULT '0.00',
	`revenue` decimal(12,2) NOT NULL DEFAULT '0.00',
	`roas` decimal(10,4) NOT NULL DEFAULT '0.0000',
	`cpa` decimal(12,2) NOT NULL DEFAULT '0.00',
	`cpm` decimal(12,2) NOT NULL DEFAULT '0.00',
	`ctr` decimal(10,4) NOT NULL DEFAULT '0.0000',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ad_engine_normalized_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ad_engine_raw_insights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` varchar(64) NOT NULL,
	`accountId` varchar(100) NOT NULL,
	`campaignId` varchar(100) NOT NULL,
	`adSetId` varchar(100),
	`adId` varchar(100),
	`metricDate` date NOT NULL,
	`payload` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ad_engine_raw_insights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `swms` (
	`id` varchar(64) NOT NULL,
	`estimateId` int NOT NULL,
	`userId` int NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`swmsStatus` enum('draft','pending_review','approved','finalized') NOT NULL DEFAULT 'draft',
	`pcbuName` varchar(255),
	`pcbuAbn` varchar(20),
	`pcbuAddress` text,
	`pcbuContact` varchar(255),
	`principalContractorName` varchar(255),
	`principalContractorAddress` text,
	`workLocation` text,
	`worksManager` varchar(255),
	`responsibleForCompliance` varchar(255),
	`responsibleForReview` varchar(255),
	`workerConsultationConfirmed` boolean DEFAULT false,
	`datePrepared` bigint,
	`reviewDate` bigint,
	`hrcwCategories` json,
	`workActivities` json,
	`pdfUrl` varchar(2048),
	`shareToken` varchar(128),
	`finalizedAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `swms_id` PRIMARY KEY(`id`),
	CONSTRAINT `swms_shareToken_unique` UNIQUE(`shareToken`)
);
--> statement-breakpoint
CREATE TABLE `swms_signatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`swmsId` varchar(64) NOT NULL,
	`workerName` varchar(255) NOT NULL,
	`workerSignature` text NOT NULL,
	`signedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `swms_signatures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `beta_signups` ADD `phone` varchar(30);--> statement-breakpoint
ALTER TABLE `beta_signups` ADD `betaIntent` enum('Pilot Spot Request','Paid Pilot Setup','Setup Call Request') DEFAULT 'Pilot Spot Request';--> statement-breakpoint
ALTER TABLE `beta_signups` ADD `utmSource` varchar(128);--> statement-breakpoint
ALTER TABLE `beta_signups` ADD `utmMedium` varchar(128);--> statement-breakpoint
ALTER TABLE `beta_signups` ADD `utmContent` varchar(128);--> statement-breakpoint
ALTER TABLE `beta_signups` ADD `utmTerm` varchar(128);--> statement-breakpoint
ALTER TABLE `beta_signups` ADD `landingPath` varchar(255);--> statement-breakpoint
ALTER TABLE `beta_signups` ADD `referrerHost` varchar(255);--> statement-breakpoint
CREATE INDEX `ad_engine_metrics_account_date_idx` ON `ad_engine_normalized_metrics` (`accountId`,`metricDate`);--> statement-breakpoint
CREATE INDEX `ad_engine_metrics_adset_date_idx` ON `ad_engine_normalized_metrics` (`adSetId`,`metricDate`);--> statement-breakpoint
CREATE INDEX `ad_engine_raw_account_date_idx` ON `ad_engine_raw_insights` (`accountId`,`metricDate`);--> statement-breakpoint
CREATE INDEX `ad_engine_raw_campaign_date_idx` ON `ad_engine_raw_insights` (`campaignId`,`metricDate`);