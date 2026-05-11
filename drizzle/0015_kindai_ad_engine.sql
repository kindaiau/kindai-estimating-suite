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
CREATE INDEX `ad_engine_raw_account_date_idx` ON `ad_engine_raw_insights` (`accountId`,`metricDate`);
--> statement-breakpoint
CREATE INDEX `ad_engine_raw_campaign_date_idx` ON `ad_engine_raw_insights` (`campaignId`,`metricDate`);
--> statement-breakpoint
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
CREATE INDEX `ad_engine_metrics_account_date_idx` ON `ad_engine_normalized_metrics` (`accountId`,`metricDate`);
--> statement-breakpoint
CREATE INDEX `ad_engine_metrics_adset_date_idx` ON `ad_engine_normalized_metrics` (`adSetId`,`metricDate`);
