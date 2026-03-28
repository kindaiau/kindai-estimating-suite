CREATE TABLE `compliance_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trade` varchar(64) NOT NULL,
	`state` enum('NSW','VIC','QLD','SA','WA','TAS','NT','ACT','ALL') NOT NULL,
	`licensingBody` varchar(200),
	`licenseType` varchar(200),
	`licenseUrl` text,
	`whsNotice` text,
	`standards` json,
	`quoteDisclaimer` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `estimates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`trade` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`status` enum('draft','review','sent','accepted','declined') NOT NULL DEFAULT 'draft',
	`subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
	`gstAmount` decimal(12,2) NOT NULL DEFAULT '0.00',
	`total` decimal(12,2) NOT NULL DEFAULT '0.00',
	`margin` decimal(5,2) DEFAULT '15.00',
	`planFileUrl` text,
	`planFileKey` text,
	`aiConfidenceScore` int,
	`aiAssumptions` json,
	`aiTakeoffData` json,
	`complianceState` enum('NSW','VIC','QLD','SA','WA','TAS','NT','ACT'),
	`complianceChecked` boolean DEFAULT false,
	`complianceNotes` text,
	`quoteNumber` varchar(50),
	`quoteValidDays` int DEFAULT 30,
	`quoteTerms` text,
	`quotePdfUrl` text,
	`quotePdfKey` text,
	`clientSignature` text,
	`clientSignedAt` timestamp,
	`acceptanceToken` varchar(64),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `estimates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `labour_rates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`trade` varchar(64) NOT NULL,
	`classification` varchar(100) NOT NULL,
	`baseRate` decimal(8,2) NOT NULL,
	`overtimeRate` decimal(8,2),
	`saturdayRate` decimal(8,2),
	`sundayRate` decimal(8,2),
	`publicHolidayRate` decimal(8,2),
	`travelAllowance` decimal(8,2) DEFAULT '0.00',
	`toolAllowance` decimal(8,2) DEFAULT '0.00',
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `labour_rates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `line_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`estimateId` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`description` varchar(500) NOT NULL,
	`unit` varchar(30) NOT NULL,
	`quantity` decimal(10,3) NOT NULL,
	`unitRate` decimal(10,2) NOT NULL,
	`wasteFactor` decimal(5,2) DEFAULT '0.00',
	`subtotal` decimal(12,2) NOT NULL,
	`isFromAi` boolean DEFAULT false,
	`notes` text,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `line_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`trade` varchar(64) NOT NULL,
	`category` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`unit` varchar(30) NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	`supplier` varchar(100),
	`supplierCode` varchar(50),
	`wasteFactor` decimal(5,2) DEFAULT '5.00',
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `materials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`clientName` varchar(255),
	`clientEmail` varchar(320),
	`clientPhone` varchar(20),
	`address` text,
	`suburb` varchar(100),
	`state` enum('NSW','VIC','QLD','SA','WA','TAS','NT','ACT'),
	`postcode` varchar(10),
	`trade` varchar(64) NOT NULL,
	`status` enum('draft','quoted','accepted','declined','invoiced','completed') NOT NULL DEFAULT 'draft',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `defaultTrade` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `companyName` text;--> statement-breakpoint
ALTER TABLE `users` ADD `abn` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `state` enum('NSW','VIC','QLD','SA','WA','TAS','NT','ACT');--> statement-breakpoint
ALTER TABLE `users` ADD `licenseNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);