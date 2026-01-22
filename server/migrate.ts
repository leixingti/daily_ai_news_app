/**
 * 数据库迁移脚本
 * 在应用启动时自动执行，确保数据库 schema 与代码同步
 */

import pg from "pg";
import { ENV } from "./_core/env";

export async function runMigrations() {
  if (!ENV.databaseUrl) {
    console.warn("[Migration] DATABASE_URL not set, skipping migrations");
    return;
  }

  const client = new pg.Client({
    connectionString: ENV.databaseUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log("[Migration] Connected to database");

    // 添加 source 字段（如果不存在）
    console.log("[Migration] Adding source column if not exists...");
    await client.query(`
      ALTER TABLE ai_news 
      ADD COLUMN IF NOT EXISTS source VARCHAR(100);
    `);
    console.log("[Migration] Source column added or already exists");

    // 为现有数据填充 source 字段
    console.log("[Migration] Updating existing records with source...");
    const result = await client.query(`
      UPDATE ai_news 
      SET source = CASE
        WHEN "sourceUrl" LIKE '%jiqizhixin.com%' THEN '机器之心'
        WHEN "sourceUrl" LIKE '%qbitai.com%' THEN '量子位'
        WHEN "sourceUrl" LIKE '%36kr.com%' THEN '36Kr'
        WHEN "sourceUrl" LIKE '%technologyreview.com%' THEN 'MIT Technology Review'
        WHEN "sourceUrl" LIKE '%arxiv.org%' THEN 'ArXiv AI'
        WHEN "sourceUrl" LIKE '%openai.com%' THEN 'OpenAI Blog'
        WHEN "sourceUrl" LIKE '%deepmind.google%' THEN 'DeepMind Blog'
        WHEN "sourceUrl" LIKE '%techcrunch.com%' THEN 'TechCrunch'
        WHEN "sourceUrl" LIKE '%ithome.com%' THEN 'IT之家'
        WHEN "sourceUrl" LIKE '%ifanr.com%' THEN '爱范儿'
        ELSE 'Unknown'
      END
      WHERE source IS NULL;
    `);
    console.log(`[Migration] Updated ${result.rowCount} records with source`);

    // 添加翻译字段（如果不存在）
    console.log("[Migration] Adding translation columns if not exist...");
    await client.query(`
      ALTER TABLE ai_news 
      ADD COLUMN IF NOT EXISTS "titleZh" TEXT,
      ADD COLUMN IF NOT EXISTS "summaryZh" TEXT,
      ADD COLUMN IF NOT EXISTS "fullContentZh" TEXT;
    `);
    console.log("[Migration] Translation columns added or already exist");

    console.log("[Migration] All migrations completed successfully");
  } catch (error) {
    console.error("[Migration] Migration failed:", error);
    throw error;
  } finally {
    await client.end();
  }
}
