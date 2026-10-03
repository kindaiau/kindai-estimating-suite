-- PREPARED ONLY. Back up and rehearse on an isolated clone before applying.
ALTER TABLE takeoff_jobs ADD COLUMN leaseExpiresAt timestamp NULL, ADD COLUMN requestPayload json NULL;
UPDATE takeoff_jobs SET leaseExpiresAt = CURRENT_TIMESTAMP;
ALTER TABLE takeoff_jobs MODIFY leaseExpiresAt timestamp NOT NULL;
ALTER TABLE quote_tokens ADD COLUMN snapshot json NULL;
-- Do not fabricate historical issued snapshots from current mutable estimates.
CREATE TABLE oauth_states (
  id varchar(64) PRIMARY KEY, userId int NOT NULL, browserHash varchar(64) NOT NULL,
  origin varchar(255) NOT NULL, expiresAt timestamp NOT NULL
);
CREATE TABLE stripe_events (id varchar(255) PRIMARY KEY, createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE email_challenges (
  userId int PRIMARY KEY, email varchar(320) NOT NULL, codeHash varchar(64) NOT NULL,
  expiresAt timestamp NOT NULL, sentAt timestamp NOT NULL, windowAt timestamp NOT NULL,
  sends int NOT NULL, attempts int NOT NULL
);
