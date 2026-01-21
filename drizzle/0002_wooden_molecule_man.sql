ALTER TABLE `ai_events` MODIFY COLUMN `url` varchar(512) NOT NULL;--> statement-breakpoint
ALTER TABLE `ai_news` MODIFY COLUMN `sourceUrl` varchar(512) NOT NULL;