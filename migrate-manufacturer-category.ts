/**
 * Migration script to update existing AI company news from 'tech' to 'manufacturer' category
 */
import "dotenv/config";
import { getDb } from "./server/db";
import { aiNews } from "./drizzle/schema";
import { eq, or } from "drizzle-orm";

const AI_COMPANY_SOURCES = [
  "OpenAI",
  "Google DeepMind",
  "Anthropic",
  "Meta AI",
  "Hugging Face",
  "智谱AI",
  "月之暗面",
  "百度AI",
  "阿里云AI",
  "字节跳动AI",
];

async function migrateCategories() {
  console.log("=".repeat(60));
  console.log("Migrating AI Company News Categories");
  console.log("=".repeat(60));

  const db = getDb();

  try {
    // Update all news from AI companies to manufacturer category
    for (const source of AI_COMPANY_SOURCES) {
      console.log(`\nUpdating news from: ${source}`);
      
      const result = await db
        .update(aiNews)
        .set({ category: "manufacturer" as any })
        .where(eq(aiNews.source, source));

      console.log(`✅ Updated ${source} news to manufacturer category`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Migration completed successfully!");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

migrateCategories();
