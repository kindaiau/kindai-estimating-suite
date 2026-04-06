CREATE TABLE `quote_followups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`estimateId` int NOT NULL,
	`userId` int NOT NULL,
	`clientEmail` varchar(320) NOT NULL,
	`clientName` varchar(255),
	`dayOffset` int NOT NULL,
	`label` varchar(100),
	`scheduledAt` bigint,
	`sentAt` bigint,
	`status` enum('scheduled','sent','cancelled','bounced') NOT NULL DEFAULT 'scheduled',
	`emailSubject` varchar(500),
	`emailBody` text,
	`openedAt` bigint,
	`clickedAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quote_followups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplier_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`supplierName` varchar(255) NOT NULL,
	`supplierWebsite` varchar(500),
	`supplierType` enum('trade_account','retail','direct','custom') NOT NULL DEFAULT 'trade_account',
	`trades` json,
	`accountNumber` varchar(100),
	`contactName` varchar(255),
	`contactEmail` varchar(320),
	`contactPhone` varchar(20),
	`discountPercent` decimal(5,2) DEFAULT '0.00',
	`notes` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplier_connections_id` PRIMARY KEY(`id`)
);
