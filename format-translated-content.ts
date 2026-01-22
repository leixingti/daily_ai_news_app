/**
 * 为已翻译的内容添加段落格式
 * 将长段落智能分割成多个段落，提升可读性
 */

import { getDb } from "./server/db";
import { aiNews } from "./drizzle/schema";
import { eq, isNotNull } from "drizzle-orm";

/**
 * 智能分段函数
 * 根据句子长度和语义标记自动分段
 */
function formatContent(text: string): string {
  if (!text) return text;

  // 移除多余的空格和换行
  text = text.trim().replace(/\s+/g, ' ');

  // 按中文句号、感叹号、问号分割
  const sentences = text.split(/([。！？])/);
  
  // 重新组合句子（保留标点符号）
  const fullSentences: string[] = [];
  for (let i = 0; i < sentences.length; i += 2) {
    const sentence = sentences[i];
    const punctuation = sentences[i + 1] || '';
    if (sentence.trim()) {
      fullSentences.push(sentence.trim() + punctuation);
    }
  }

  // 每3-4句组成一个段落
  const paragraphs: string[] = [];
  let currentParagraph = '';
  let sentenceCount = 0;
  const sentencesPerParagraph = 3;

  for (let i = 0; i < fullSentences.length; i++) {
    currentParagraph += fullSentences[i];
    sentenceCount++;

    // 达到段落句子数，或者是最后一句
    if (sentenceCount >= sentencesPerParagraph || i === fullSentences.length - 1) {
      paragraphs.push(currentParagraph.trim());
      currentParagraph = '';
      sentenceCount = 0;
    }
  }

  // 用双换行符连接段落
  return paragraphs.join('\n\n');
}

/**
 * 批量格式化已翻译的内容
 */
async function formatTranslatedContent() {
  console.log("=== 开始格式化翻译内容 ===\n");

  const db = await getDb();
  if (!db) {
    console.error("数据库连接失败");
    return;
  }

  try {
    // 查询所有有翻译内容的国际新闻
    console.log("正在查询已翻译的国际新闻...");
    const translatedNews = await db
      .select()
      .from(aiNews)
      .where(eq(aiNews.region, "international"))
      .limit(100);

    // 过滤出有翻译内容的新闻
    const newsWithTranslation = translatedNews.filter(
      news => news.fullContentZh && news.fullContentZh.length > 100
    );

    console.log(`找到 ${newsWithTranslation.length} 条需要格式化的新闻\n`);

    let formattedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < newsWithTranslation.length; i++) {
      const news = newsWithTranslation[i];
      console.log(`\n[${i + 1}/${newsWithTranslation.length}] 处理新闻 ID: ${news.id}`);
      console.log(`标题: ${news.titleZh || news.title}`);

      try {
        // 格式化翻译内容
        const formattedContent = formatContent(news.fullContentZh!);
        
        // 计算段落数
        const paragraphCount = formattedContent.split('\n\n').length;
        console.log(`原始内容: ${news.fullContentZh!.length} 字符`);
        console.log(`格式化后: ${formattedContent.length} 字符，${paragraphCount} 个段落`);

        // 更新数据库
        await db
          .update(aiNews)
          .set({
            fullContentZh: formattedContent,
            updatedAt: new Date(),
          })
          .where(eq(aiNews.id, news.id));

        console.log("✓ 格式化完成并保存");
        formattedCount++;

      } catch (error) {
        console.error(`✗ 格式化失败:`, error);
        errorCount++;
      }
    }

    console.log("\n=== 格式化完成 ===");
    console.log(`总计: ${newsWithTranslation.length} 条`);
    console.log(`已格式化: ${formattedCount} 条`);
    console.log(`失败: ${errorCount} 条`);

  } catch (error) {
    console.error("格式化过程中出错:", error);
  }
}

// 运行脚本
formatTranslatedContent()
  .then(() => {
    console.log("\n✅ 脚本执行完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 脚本执行失败:", error);
    process.exit(1);
  });
