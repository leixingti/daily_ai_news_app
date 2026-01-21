CREATE TABLE `ai_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`url` varchar(512) NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`location` text,
	`event_type` enum('online','offline') NOT NULL,
	`region` enum('domestic','international') NOT NULL DEFAULT 'international',
	`registrationUrl` text,
	`speakers` text,
	`expectedAttendees` int,
	`agenda` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_events_url_unique` UNIQUE(`url`)
);
--> statement-breakpoint
CREATE TABLE `ai_news` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`content` text NOT NULL,
	`sourceUrl` varchar(512) NOT NULL,
	`category` enum('tech','product','industry','event') NOT NULL DEFAULT 'tech',
	`region` enum('domestic','international') NOT NULL DEFAULT 'international',
	`publishedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`contentHash` varchar(64) NOT NULL,
	`relatedNewsId` int,
	`isDuplicate` int NOT NULL DEFAULT 0,
	`similarityScore` int NOT NULL DEFAULT 0,
	`translationStatus` int NOT NULL DEFAULT 1,
	`translationRetries` int NOT NULL DEFAULT 0,
	CONSTRAINT `ai_news_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`newsId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `read_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`newsId` int NOT NULL,
	`readAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `read_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rss_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`url` varchar(512) NOT NULL,
	`description` text,
	`is_active` int NOT NULL DEFAULT 1,
	`region` enum('domestic','international') NOT NULL DEFAULT 'international',
	`last_fetched_at` timestamp,
	`success_count` int NOT NULL DEFAULT 0,
	`failure_count` int NOT NULL DEFAULT 0,
	`total_news_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rss_sources_id` PRIMARY KEY(`id`),
	CONSTRAINT `rss_sources_url_unique` UNIQUE(`url`)
);
--> statement-breakpoint
CREATE TABLE `search_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`query` text NOT NULL,
	`resultCount` int NOT NULL DEFAULT 0,
	`searchedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `search_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `system_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(64) NOT NULL,
	`value` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `system_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `system_config_key_unique` UNIQUE(`key`)
);
