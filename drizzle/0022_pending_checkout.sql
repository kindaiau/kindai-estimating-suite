-- PREPARED ONLY. Rehearse with 0020/0021 on an isolated restored clone.
CREATE TABLE checkout_attempts (
  userId int PRIMARY KEY, id varchar(64) NOT NULL UNIQUE,
  options json NOT NULL, sessionId varchar(255) NULL,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
