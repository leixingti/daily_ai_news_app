/**
 * 批量翻译现有国际新闻的标题和摘要
 * 用于将数据库中已存在的英文新闻翻译成中文
 */

import { getDb } from "./server/db";
import { aiNews } from "./drizzle/schema";
import { eq } from "drizzle-orm";
import { invokeLLM } from "./server/_core/llm";

/**
 * 翻译文本
 */
async function translateText(text: string, targetLanguage: string = "zh"): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text to ${targetLanguage}. Keep the translation concise and accurate. Only return the translated text without any explanation.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content;
    const translatedText = typeof content === "string" ? content : text;
    return translatedText;
  } catch (error) {
    console.error("[BatchTranslate] Translation failed:", error);
    return text;
  }
}

/**
 * 检测文本是否为英文
 */
function isEnglish(text: string): boolean {
  // 简单检测：如果英文字符占比超过 50%，认为是英文
  const englishChars = text.match(/[a-zA-Z]/g);
  const totalChars = text.replace(/\s/g, "").length;
  
  if (!englishChars || totalChars === 0) return false;
  
  const englishRatio = englishChars.length / totalChars;
  return englishRatio > 0.5;
}

/**
 * 批量翻译国际新闻
 */
async function batchTranslateNews() {
  console.log("=== 开始批量翻译国际新闻 ===\n");

  const db = await getDb();
  if (!db) {
    console.error("数据库连接失败");
    return;
  }

  try {
    // 查询所有国际新闻
    console.log("正在查询国际新闻...");
    const internationalNews = await db
      .select()
      .from(aiNews)
      .where(eq(aiNews.region, "international"))
      .limit(50); // 限制一次处理 50 条，避免超时

    console.log(`找到 ${internationalNews.length} 条国际新闻\n`);

    let translatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < internationalNews.length; i++) {
      const news = internationalNews[i];
      console.log(`\n[${i + 1}/${internationalNews.length}] 处理新闻 ID: ${news.id}`);
      console.log(`原标题: ${news.title.substring(0, 60)}...`);

      // 检查标题是否需要翻译
      const titleNeedsTranslation = isEnglish(news.title);
      const summaryNeedsTranslation = isEnglish(news.summary);

      if (!titleNeedsTranslation && !summaryNeedsTranslation) {
        console.log("✓ 已是中文，跳过");
        skippedCount++;
        continue;
      }

      try {
        let translatedTitle = news.title;
        let translatedSummary = news.summary;

        // 并行翻译标题和摘要
        if (titleNeedsTranslation || summaryNeedsTranslation) {
          console.log("正在翻译...");
          
          const promises = [];
          if (titleNeedsTranslation) {
            promises.push(translateText(news.title));
          } else {
            promises.push(Promise.resolve(news.title));
          }
          
          if (summaryNeedsTranslation) {
            promises.push(translateText(news.summary));
          } else {
            promises.push(Promise.resolve(news.summary));
          }

          const [titleResult, summaryResult] = await Promise.all(promises);
          translatedTitle = titleResult;
          translatedSummary = summaryResult;

          console.log(`译标题: ${translatedTitle.substring(0, 60)}...`);

          // 更新数据库
          await db
            .update(aiNews)
            .set({
              title: translatedTitle,
              summary: translatedSummary,
              content: translatedSummary, // 同时更新 content 字段
              updatedAt: new Date(),
            })
            .where(eq(aiNews.id, news.id));

          console.log("✓ 翻译完成并保存");
          translatedCount++;
        }

        // 添加延迟，避免 API 限流
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`✗ 翻译失败:`, error);
        errorCount++;
      }
    }

    console.log("\n=== 批量翻译完成 ===");
    console.log(`总计: ${internationalNews.length} 条`);
    console.log(`已翻译: ${translatedCount} 条`);
    console.log(`已跳过: ${skippedCount} 条`);
    console.log(`失败: ${errorCount} 条`);

  } catch (error) {
    console.error("批量翻译过程中出错:", error);
  }
}

// 运行脚本
batchTranslateNews()
  .then(() => {
    console.log("\n✅ 脚本执行完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 脚本执行失败:", error);
    process.exit(1);
  });
