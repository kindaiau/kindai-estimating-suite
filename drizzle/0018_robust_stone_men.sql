CREATE TABLE `ai_corrections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`trade` varchar(64) NOT NULL,
	`context` varchar(500) NOT NULL,
	`aiOriginal` text NOT NULL,
	`userCorrected` text NOT NULL,
	`category` enum('ppe','control','hazard','procedure','standard_ref','other') NOT NULL,
	`swmsId` int,
	`useCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_corrections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_safety_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`trade` varchar(64),
	`category` enum('ppe','control','procedure','terminology','emergency') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`standardRef` varchar(255),
	`isDefault` boolean DEFAULT true,
	`source` enum('manual_entry','uploaded_swms','learned_from_edits') NOT NULL DEFAULT 'manual_entry',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_safety_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `company_procedures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`trade` varchar(64),
	`category` enum('ppe','control','procedure','terminology','emergency','signoff') NOT NULL,
	`description` text NOT NULL,
	`confidence` int NOT NULL DEFAULT 70,
	`extractedFrom` varchar(500),
	`sourceUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `company_procedures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `site_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`swmsId` int,
	`estimateId` int,
	`photoUrl` text NOT NULL,
	`photoKey` varchar(500) NOT NULL,
	`analysisResult` json,
	`overallRiskLevel` enum('critical','high','medium','low'),
	`hazardCount` int DEFAULT 0,
	`analysedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `site_photos_id` PRIMARY KEY(`id`)
);
