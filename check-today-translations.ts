import { getDb } from './server/db';
import { aiNews } from './drizzle/schema';
import { sql } from 'drizzle-orm';

async function checkTodayTranslations() {
  try {
    const db = await getDb();
    if (!db) {
      console.error('Database not available');
      process.exit(1);
    }
    
    // 获取今天的国际新闻
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const internationalNews = await db
      .select()
      .from(aiNews)
      .where(sql`${aiNews.region} = 'international' AND ${aiNews.publishedAt} >= ${today}`)
      .orderBy(sql`${aiNews.publishedAt} DESC`)
      .limit(20);
    
    console.log(`\n今天的国际新闻总数: ${internationalNews.length}\n`);
    
    let translatedCount = 0;
    let notTranslatedCount = 0;
    
    internationalNews.forEach((news, index) => {
      const hasTranslation = news.translatedTitle || news.translatedSummary || news.translatedContent;
      if (hasTranslation) {
        translatedCount++;
      } else {
        notTranslatedCount++;
      }
      
      console.log(`${index + 1}. ${news.title}`);
      console.log(`   发布时间: ${news.publishedAt}`);
      console.log(`   翻译状态: ${hasTranslation ? '✅ 已翻译' : '❌ 未翻译'}`);
      if (hasTranslation && news.translatedTitle) {
        console.log(`   翻译标题: ${news.translatedTitle}`);
      }
      console.log('');
    });
    
    console.log(`\n统计:`);
    console.log(`已翻译: ${translatedCount}`);
    console.log(`未翻译: ${notTranslatedCount}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkTodayTranslations();
