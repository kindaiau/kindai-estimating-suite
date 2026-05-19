CREATE TABLE `organizations` (
  `id` int AUTO_INCREMENT NOT NULL,
  `ownerUserId` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `industryKey` varchar(64) NOT NULL,
  `tradeId` varchar(64) NOT NULL,
  `plan` enum('starter','pro','scale','enterprise') NOT NULL DEFAULT 'starter',
  `status` enum('onboarding','active','paused','cancelled') NOT NULL DEFAULT 'onboarding',
  `website` varchar(255),
  `phone` varchar(30),
  `abn` varchar(20),
  `state` enum('NSW','VIC','QLD','SA','WA','TAS','NT','ACT'),
  `settings` json,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `organizations_id` PRIMARY KEY(`id`)
);
CREATE INDEX `organizations_owner_idx` ON `organizations` (`ownerUserId`);
CREATE INDEX `organizations_industry_idx` ON `organizations` (`industryKey`);

CREATE TABLE `crm_leads` (
  `id` int AUTO_INCREMENT NOT NULL,
  `organizationId` int NOT NULL,
  `userId` int NOT NULL,
  `industryKey` varchar(64) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(320),
  `phone` varchar(30),
  `company` varchar(255),
  `jobType` varchar(128),
  `source` varchar(128) DEFAULT 'manual',
  `utmSource` varchar(128),
  `utmCampaign` varchar(128),
  `score` int NOT NULL DEFAULT 50,
  `pipelineStage` enum('new_lead','qualified','quote_sent','follow_up','won','lost') NOT NULL DEFAULT 'new_lead',
  `status` enum('open','won','lost','archived') NOT NULL DEFAULT 'open',
  `tags` json,
  `notes` text,
  `nextAction` varchar(255),
  `nextActionAt` bigint,
  `lastContactedAt` bigint,
  `qualification` json,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `crm_leads_id` PRIMARY KEY(`id`)
);
CREATE INDEX `crm_leads_org_stage_idx` ON `crm_leads` (`organizationId`, `pipelineStage`);
CREATE INDEX `crm_leads_user_idx` ON `crm_leads` (`userId`);

CREATE TABLE `crm_activities` (
  `id` int AUTO_INCREMENT NOT NULL,
  `leadId` int NOT NULL,
  `organizationId` int NOT NULL,
  `userId` int NOT NULL,
  `type` enum('note','email','call','sms','task','status_change','quote','automation') NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` text,
  `metadata` json,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `crm_activities_id` PRIMARY KEY(`id`)
);
CREATE INDEX `crm_activities_lead_idx` ON `crm_activities` (`leadId`);
CREATE INDEX `crm_activities_org_idx` ON `crm_activities` (`organizationId`);

CREATE TABLE `business_tasks` (
  `id` int AUTO_INCREMENT NOT NULL,
  `organizationId` int NOT NULL,
  `userId` int NOT NULL,
  `leadId` int,
  `projectId` int,
  `title` varchar(255) NOT NULL,
  `description` text,
  `status` enum('todo','in_progress','blocked','done','cancelled') NOT NULL DEFAULT 'todo',
  `priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
  `dueAt` bigint,
  `assignedToUserId` int,
  `automationKey` varchar(128),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `business_tasks_id` PRIMARY KEY(`id`)
);
CREATE INDEX `business_tasks_org_status_idx` ON `business_tasks` (`organizationId`, `status`);

CREATE TABLE `delivery_projects` (
  `id` int AUTO_INCREMENT NOT NULL,
  `organizationId` int NOT NULL,
  `userId` int NOT NULL,
  `leadId` int,
  `estimateId` int,
  `industryKey` varchar(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `clientName` varchar(255),
  `status` enum('onboarding','planning','in_progress','waiting','complete','cancelled') NOT NULL DEFAULT 'onboarding',
  `currentStep` varchar(128),
  `startDate` date,
  `targetCompletionDate` date,
  `budget` decimal(14,2),
  `notes` text,
  `workflowState` json,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `delivery_projects_id` PRIMARY KEY(`id`)
);
CREATE INDEX `delivery_projects_org_status_idx` ON `delivery_projects` (`organizationId`, `status`);

CREATE TABLE `automation_logs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `organizationId` int NOT NULL,
  `userId` int,
  `agent` enum('acquisition','conversion','delivery','system') NOT NULL DEFAULT 'system',
  `eventType` varchar(128) NOT NULL,
  `status` enum('queued','drafted','sent','skipped','failed') NOT NULL DEFAULT 'queued',
  `targetType` varchar(64),
  `targetId` int,
  `payload` json,
  `errorMessage` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `automation_logs_id` PRIMARY KEY(`id`)
);
CREATE INDEX `automation_logs_org_created_idx` ON `automation_logs` (`organizationId`, `createdAt`);

CREATE TABLE `analytics_events` (
  `id` int AUTO_INCREMENT NOT NULL,
  `organizationId` int,
  `userId` int,
  `industryKey` varchar(64),
  `eventName` varchar(128) NOT NULL,
  `source` varchar(128),
  `properties` json,
  `occurredAt` bigint NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`)
);
CREATE INDEX `analytics_events_org_event_idx` ON `analytics_events` (`organizationId`, `eventName`);

CREATE TABLE `prompt_templates` (
  `id` int AUTO_INCREMENT NOT NULL,
  `organizationId` int,
  `industryKey` varchar(64) NOT NULL,
  `agent` enum('acquisition','conversion','delivery','estimator') NOT NULL,
  `name` varchar(255) NOT NULL,
  `systemPrompt` text NOT NULL,
  `version` int NOT NULL DEFAULT 1,
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `prompt_templates_id` PRIMARY KEY(`id`)
);
CREATE INDEX `prompt_templates_org_industry_idx` ON `prompt_templates` (`organizationId`, `industryKey`);
