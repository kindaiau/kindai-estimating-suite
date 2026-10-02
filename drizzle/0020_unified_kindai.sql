-- Prepared only. Back up and review against the deployed schema before applying.
ALTER TABLE users ADD COLUMN emailVerified boolean NOT NULL DEFAULT false;
ALTER TABLE users MODIFY COLUMN subscriptionTier enum('free','sole_trader','small_builder','mid_builder','enterprise','pro') NOT NULL DEFAULT 'free';
CREATE TABLE takeoff_jobs (
 id varchar(100) PRIMARY KEY, userId int NOT NULL, freeUserId int NULL UNIQUE,
 estimateId int NOT NULL, expectedVersion int NOT NULL, requestHash varchar(64) NOT NULL,
 status enum('running','completed','failed') NOT NULL, attempts int NOT NULL DEFAULT 1,
 result json, createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE plan_uploads (
 fileKey varchar(255) PRIMARY KEY, userId int NOT NULL, url text NOT NULL, pageCount int NOT NULL
);
-- Do not infer email verification from a non-empty email or backfill legacy users as verified.
-- Existing tiers/prices/subscriptions remain unchanged. No data deletion or repricing.
