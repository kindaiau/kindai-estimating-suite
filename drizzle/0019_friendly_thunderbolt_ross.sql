ALTER TABLE `users` ADD `isBetaUser` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `betaExpiresAt` timestamp;