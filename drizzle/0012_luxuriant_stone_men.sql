ALTER TABLE `trade_profiles` ADD `materialMarkup` decimal(5,2) DEFAULT '20.00';--> statement-breakpoint
ALTER TABLE `trade_profiles` ADD `overheadPercent` decimal(5,2) DEFAULT '10.00';--> statement-breakpoint
ALTER TABLE `trade_profiles` ADD `profitMargin` decimal(5,2) DEFAULT '15.00';--> statement-breakpoint
ALTER TABLE `trade_profiles` ADD `defaultWasteFactor` decimal(5,2) DEFAULT '5.00';--> statement-breakpoint
ALTER TABLE `trade_profiles` ADD `mobilisationRate` decimal(8,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `trade_profiles` ADD `contingencyPercent` decimal(5,2) DEFAULT '5.00';