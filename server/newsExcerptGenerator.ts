/**
 * 新闻摘要和翻译生成器
 * 为新闻生成 500 字摘要，国外新闻翻译摘要
 */

import { getDb } from "./db";
import { aiNews } from "../drizzle/schema";
import { eq, isNull } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

/**
 * 生成新闻摘要（500 字）
 */
async function generateExcerpt(title: string, content: string): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a professional news summarizer. Generate a concise summary of the following news article in 400-500 words. The summary should capture the key points and be suitable for quick reading. Write in the same language as the original content.",
        },
        {
          role: "user",
          content: `Title: ${title}\n\nContent: ${content}`,
        },
      ],
    });

    const content_response = response.choices?.[0]?.message?.content;
    const excerpt = typeof content_response === "string" ? content_response : "";
    return excerpt.substring(0, 2000); // 限制为 2000 字符（约 500 字）
  } catch (error) {
    console.error("[NewsExcerptGenerator] Failed to generate excerpt:", error);
    return content.substring(0, 500); // 失败时返回原文前 500 字
  }
}

/**
 * 翻译摘要为中文（国外新闻）
 */
async function translateExcerpt(excerpt: string): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a professional translator. Translate the following news summary to Chinese (Simplified). Keep the translation accurate and maintain the original meaning. Only return the translated text without any explanation.",
        },
        {
          role: "user",
          content: excerpt,
        },
      ],
    });

    const content_response = response.choices?.[0]?.message?.content;
    const translated = typeof content_response === "string" ? content_response : excerpt;
    return translated;
  } catch (error) {
    console.error("[NewsExcerptGenerator] Failed to translate excerpt:", error);
    return excerpt; // 翻译失败时返回原文
  }
}

/**
 * 为单条新闻生成摘要和翻译
 */
async function processNewsItem(newsId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[NewsExcerptGenerator] Database not available");
    return false;
  }

  try {
    // 获取新闻
    const news = await db
      .select()
      .from(aiNews)
      .where(eq(aiNews.id, newsId))
      .limit(1);

    if (news.length === 0) {
      console.warn(`[NewsExcerptGenerator] News ${newsId} not found`);
      return false;
    }

    const newsItem = news[0];

    // 如果已经生成过摘要，跳过
    if ((newsItem as any).excerpt) {
      return false;
    }

    // 生成摘要
    const excerpt = await generateExcerpt(newsItem.title, newsItem.content);

    // 国外新闻翻译摘要
    let excerptTranslated: string | null = null;
    if (newsItem.region === "international") {
      excerptTranslated = await translateExcerpt(excerpt);
    }

    // 更新数据库
    const updateData: any = {
      excerptGeneratedAt: new Date(),
      updatedAt: new Date(),
    };
    if (excerpt) {
      updateData.excerpt = excerpt;
    }
    if (excerptTranslated) {
      updateData.excerptTranslated = excerptTranslated;
    }
    await db
      .update(aiNews)
      .set(updateData)
      .where(eq(aiNews.id, newsId));

    console.log(`[NewsExcerptGenerator] Generated excerpt for news ${newsId}`);
    return true;
  } catch (error) {
    console.error(`[NewsExcerptGenerator] Failed to process news ${newsId}:`, error);
    return false;
  }
}

/**
 * 批量处理未生成摘要的新闻
 */
export async function processAllPendingNews(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[NewsExcerptGenerator] Database not available");
    return;
  }

  try {
    console.log("[NewsExcerptGenerator] Starting to process pending news...");

    // 获取所有未生成摘要的新闻
    const pendingNews = await db
      .select()
      .from(aiNews)
      .where(isNull((aiNews as any).excerpt))
      .limit(10); // 每次处理最多 10 条

    if (pendingNews.length === 0) {
      console.log("[NewsExcerptGenerator] No pending news to process");
      return;
    }

    console.log(`[NewsExcerptGenerator] Found ${pendingNews.length} pending news items`);

    let processed = 0;
    for (const newsItem of pendingNews) {
      const success = await processNewsItem(newsItem.id);
      if (success) {
        processed++;
      }
      // 避免过快调用 LLM API
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(
      `[NewsExcerptGenerator] Processed ${processed}/${pendingNews.length} news items`
    );
  } catch (error) {
    console.error("[NewsExcerptGenerator] Failed to process pending news:", error);
  }
}

/**
 * 初始化摘要生成调度（每 30 分钟运行一次）
 */
export function initializeNewsExcerptGeneratorSchedule(): void {
  // 立即运行一次
  processAllPendingNews();

  // 每 30 分钟运行一次
  setInterval(() => {
    processAllPendingNews();
  }, 30 * 60 * 1000);

  console.log("[NewsExcerptGenerator] Scheduled to run every 30 minutes");
}
