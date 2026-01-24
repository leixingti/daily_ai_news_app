import { getDb } from "./server/db";
import { aiNews } from "./drizzle/schema";
import { sql, eq } from "drizzle-orm";
import { invokeLLM } from "./server/_core/llm";

async function translateText(text: string): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a professional translator. Translate the following text to Chinese (Simplified). Keep the translation concise and accurate. Only return the translated text without any explanation.",
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content;
    return typeof content === "string" ? content : text;
  } catch (error) {
    console.error("[Translate] Failed:", error);
    throw error;
  }
}

async function translateTodayNews() {
  console.log("=== 开始翻译今天的国际新闻 ===\n");

  const db = await getDb();
  if (!db) {
    console.error("数据库连接失败");
    process.exit(1);
  }

  try {
    // 获取今天的国际新闻
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const internationalNews = await db
      .select()
      .from(aiNews)
      .where(sql`${aiNews.region} = 'international' AND ${aiNews.publishedAt} >= ${today}`)
      .orderBy(sql`${aiNews.publishedAt} DESC`);
    
    console.log(`找到 ${internationalNews.length} 条今天的国际新闻\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < internationalNews.length; i++) {
      const news = internationalNews[i];
      console.log(`\n[${i + 1}/${internationalNews.length}] ID: ${news.id}`);
      console.log(`原标题: ${news.title.substring(0, 80)}...`);

      try {
        // 翻译标题和摘要
        console.log("正在翻译标题...");
        const translatedTitle = await translateText(news.title);
        
        console.log("正在翻译摘要...");
        const translatedSummary = await translateText(news.summary);
        
        console.log(`译标题: ${translatedTitle.substring(0, 80)}...`);

        // 更新数据库
        await db
          .update(aiNews)
          .set({
            titleZh: translatedTitle,
            summaryZh: translatedSummary,
            fullContentZh: translatedSummary, // 暂时使用摘要作为内容
            updatedAt: new Date(),
          })
          .where(eq(aiNews.id, news.id));

        console.log("✓ 翻译完成并保存");
        successCount++;

        // 添加延迟，避免 API 限流
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.error(`✗ 翻译失败:`, error.message || error);
        errorCount++;
        
        // 如果是 API 错误，停止继续翻译
        if (error.message?.includes('API') || error.message?.includes('quota')) {
          console.error("\n❌ API 配额用完或出错，停止翻译");
          break;
        }
      }
    }

    console.log("\n=== 翻译完成 ===");
    console.log(`总计: ${internationalNews.length} 条`);
    console.log(`成功: ${successCount} 条`);
    console.log(`失败: ${errorCount} 条`);

  } catch (error) {
    console.error("翻译过程中出错:", error);
  } finally {
    process.exit(0);
  }
}

translateTodayNews();
