CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`userName` varchar(255),
	`userEmail` varchar(320),
	`action` enum('create','update','delete','view','export','login','logout','invite','accept','award') NOT NULL,
	`entityType` varchar(64) NOT NULL,
	`entityId` int,
	`entityName` varchar(255),
	`projectId` int,
	`beforeData` json,
	`afterData` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cost_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`code` varchar(30) NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(100),
	`budgetAmount` decimal(14,2) DEFAULT '0.00',
	`committedAmount` decimal(14,2) DEFAULT '0.00',
	`actualAmount` decimal(14,2) DEFAULT '0.00',
	`forecastAmount` decimal(14,2) DEFAULT '0.00',
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cost_codes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`userId` int,
	`email` varchar(320) NOT NULL,
	`name` varchar(255),
	`role` enum('owner','estimator','project_manager','quantity_surveyor','viewer') NOT NULL,
	`status` enum('pending','active','suspended') NOT NULL DEFAULT 'pending',
	`inviteToken` varchar(64),
	`inviteExpiresAt` timestamp,
	`acceptedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tender_bids` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenderId` int NOT NULL,
	`subcontractorName` varchar(255) NOT NULL,
	`subcontractorEmail` varchar(320),
	`subcontractorPhone` varchar(20),
	`subcontractorAbn` varchar(20),
	`bidAmount` decimal(14,2),
	`gstIncluded` boolean DEFAULT true,
	`completionWeeks` int,
	`inclusions` text,
	`exclusions` text,
	`notes` text,
	`attachmentUrl` text,
	`submissionToken` varchar(64),
	`status` enum('invited','submitted','under_review','shortlisted','awarded','declined') NOT NULL DEFAULT 'invited',
	`submittedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tender_bids_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`title` varchar(255) NOT NULL,
	`tenderNumber` varchar(50),
	`trade` varchar(64) NOT NULL,
	`scopeOfWorks` text,
	`siteAddress` text,
	`estimatedValue` decimal(14,2),
	`dueDate` timestamp,
	`status` enum('draft','issued','bids_received','under_review','awarded','closed') NOT NULL DEFAULT 'draft',
	`awardedBidId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `variations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`estimateId` int,
	`userId` int NOT NULL,
	`variationNumber` varchar(50),
	`title` varchar(255) NOT NULL,
	`description` text,
	`reason` enum('client_request','design_change','site_condition','scope_omission','regulatory','other') NOT NULL DEFAULT 'client_request',
	`costImpact` decimal(14,2) NOT NULL,
	`timeImpactDays` int DEFAULT 0,
	`status` enum('draft','submitted','approved','rejected','on_hold') NOT NULL DEFAULT 'draft',
	`approvedBy` varchar(255),
	`approvedAt` timestamp,
	`attachmentUrl` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `variations_id` PRIMARY KEY(`id`)
);
