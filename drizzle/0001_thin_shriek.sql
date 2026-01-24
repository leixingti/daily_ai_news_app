ALTER TABLE "ai_news" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "ai_news" ALTER COLUMN "category" SET DEFAULT 'tech'::text;--> statement-breakpoint
DROP TYPE "public"."category";--> statement-breakpoint
CREATE TYPE "public"."category" AS ENUM('tech', 'product', 'industry', 'manufacturer', 'ai_company');--> statement-breakpoint
ALTER TABLE "ai_news" ALTER COLUMN "category" SET DEFAULT 'tech'::"public"."category";--> statement-breakpoint
ALTER TABLE "ai_news" ALTER COLUMN "category" SET DATA TYPE "public"."category" USING "category"::"public"."category";