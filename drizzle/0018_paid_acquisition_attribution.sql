ALTER TABLE `beta_signups` ADD `utmSource` varchar(128);
--> statement-breakpoint
ALTER TABLE `beta_signups` ADD `utmMedium` varchar(128);
--> statement-breakpoint
ALTER TABLE `beta_signups` ADD `utmContent` varchar(128);
--> statement-breakpoint
ALTER TABLE `beta_signups` ADD `utmTerm` varchar(128);
--> statement-breakpoint
ALTER TABLE `beta_signups` ADD `landingPath` varchar(255);
--> statement-breakpoint
ALTER TABLE `beta_signups` ADD `referrerHost` varchar(255);
