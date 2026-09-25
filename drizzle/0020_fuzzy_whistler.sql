CREATE TABLE `ai_usage_events` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `requestKey` varchar(255) NOT NULL,
  `quotaSlot` int,
  `usageType` enum('plan_reading') NOT NULL,
  `usageStatus` enum('reserved','completed','failed') NOT NULL DEFAULT 'reserved',
  `periodStart` date NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `completedAt` timestamp,
  CONSTRAINT `ai_usage_events_id` PRIMARY KEY(`id`),
  CONSTRAINT `ai_usage_user_request_unique` UNIQUE(`userId`,`requestKey`),
  CONSTRAINT `ai_usage_user_period_slot_unique` UNIQUE(`userId`,`periodStart`,`quotaSlot`)
);
--> statement-breakpoint
ALTER TABLE `beta_signups` ADD `offerVersion` varchar(32);
--> statement-breakpoint
ALTER TABLE `beta_signups` ADD `pilotPaymentStatus` enum('unpaid','paid','refunded') DEFAULT 'unpaid' NOT NULL;
--> statement-breakpoint
ALTER TABLE `beta_signups` ADD `stripeCheckoutSessionId` varchar(255);
--> statement-breakpoint
ALTER TABLE `beta_signups` ADD `amountPaid` int;
--> statement-breakpoint
ALTER TABLE `beta_signups` ADD `paymentCurrency` varchar(3);
--> statement-breakpoint
ALTER TABLE `beta_signups` ADD `paidAt` timestamp;
--> statement-breakpoint
ALTER TABLE `beta_signups` ADD `accessExpiresAt` timestamp;
--> statement-breakpoint
ALTER TABLE `beta_signups` ADD `confirmationClaimedAt` timestamp;
--> statement-breakpoint
ALTER TABLE `beta_signups` ADD `confirmationSentAt` timestamp;
--> statement-breakpoint
ALTER TABLE `beta_signups` ADD CONSTRAINT `beta_signups_stripeCheckoutSessionId_unique` UNIQUE(`stripeCheckoutSessionId`);
--> statement-breakpoint
CREATE INDEX `ai_usage_user_period_status_idx` ON `ai_usage_events` (`userId`,`periodStart`,`usageStatus`);
