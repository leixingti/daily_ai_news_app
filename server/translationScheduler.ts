import { getDb } from "./db";
import { aiNews } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

/**
 * Translation Scheduler
 * Automatically translates international AI news from English to Chinese
 */

/**
 * Translate a single news item
 */
async function translateNewsItem(news: any): Promise<void> {
  try {
    console.log(`[Translation] Translating news ID: ${news.id} - ${news.title}`);

    // Prepare translation prompt
    const prompt = `请将以下英文AI新闻翻译成中文，保持专业性和准确性。只返回翻译后的内容，不要添加任何解释。

标题：${news.title}

摘要：${news.summary}

内容：${news.content}

请按以下JSON格式返回翻译结果：
{
  "title": "翻译后的标题",
  "summary": "翻译后的摘要",
  "content": "翻译后的内容"
}`;

    // Call LLM for translation
    const result = await invokeLLM({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      responseFormat: { type: "json_object" },
    });

    const translatedText = result.choices[0]?.message?.content;
    if (!translatedText || typeof translatedText !== "string") {
      throw new Error("Invalid translation result");
    }

    const translated = JSON.parse(translatedText);

    // Update database with translated content
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    await db
      .update(aiNews)
      .set({
        title: translated.title || news.title,
        summary: translated.summary || news.summary,
        content: translated.content || news.content,
        translationStatus: 2, // 2 = translated
      })
      .where(eq(aiNews.id, news.id));

    console.log(`[Translation] Successfully translated news ID: ${news.id}`);
  } catch (error) {
    console.error(`[Translation] Failed to translate news ID: ${news.id}`, error);
    
    // Mark as failed (status 3)
    try {
      const db = await getDb();
      if (db) {
        await db
          .update(aiNews)
          .set({
            translationStatus: 3, // 3 = failed
          })
          .where(eq(aiNews.id, news.id));
      }
    } catch (updateError) {
      console.error(`[Translation] Failed to update status for news ID: ${news.id}`, updateError);
    }
  }
}

/**
 * Process all pending translations
 */
export async function processAllPendingTranslations(): Promise<void> {
  console.log("[Translation] Starting translation process...");

  try {
    const db = await getDb();
    if (!db) {
      console.error("[Translation] Database not available");
      return;
    }

    // Get all news items with translationStatus = 1 (pending)
    const pendingNews = await db
      .select()
      .from(aiNews)
      .where(eq(aiNews.translationStatus, 1))
      .limit(20); // Process 20 items at a time to avoid overwhelming the API

    if (pendingNews.length === 0) {
      console.log("[Translation] No pending translations");
      return;
    }

    console.log(`[Translation] Found ${pendingNews.length} news items to translate`);

    // Translate items sequentially to avoid rate limits
    for (const news of pendingNews) {
      await translateNewsItem(news);
      // Add a small delay between translations to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    }

    console.log(`[Translation] Completed translation process`);
  } catch (error) {
    console.error("[Translation] Translation process failed:", error);
  }
}

/**
 * Initialize translation scheduler
 */
export function initializeTranslationSchedule(): void {
  // Run immediately on startup
  setTimeout(() => {
    processAllPendingTranslations();
  }, 60000); // 1 minute delay after server starts

  // Run every 5 minutes
  setInterval(() => {
    processAllPendingTranslations();
  }, 5 * 60 * 1000); // 5 minutes

  console.log("[Translation] Scheduled to run every 5 minutes");
}
