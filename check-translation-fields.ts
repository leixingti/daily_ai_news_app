import { getDb } from './server/db.js';
import { aiNews } from './drizzle/schema.js';
import { eq, and, isNotNull } from 'drizzle-orm';

async function checkTranslationFields() {
  const db = await getDb();
  if (!db) {
    console.error('[Error] Failed to connect to database');
    process.exit(1);
  }
  
  console.log('[Check] Checking translation fields in database...\n');

  // 查询一条已翻译的 NVIDIA 新闻
  const translatedNews = await db
    .select({
      id: aiNews.id,
      title: aiNews.title,
      titleZh: aiNews.titleZh,
      summary: aiNews.summary,
      summaryZh: aiNews.summaryZh,
      source: aiNews.source,
      region: aiNews.region,
    })
    .from(aiNews)
    .where(
      and(
        eq(aiNews.source, 'NVIDIA AI'),
        isNotNull(aiNews.titleZh)
      )
    )
    .limit(3);

  console.log(`[Check] Found ${translatedNews.length} translated NVIDIA news\n`);

  for (const news of translatedNews) {
    console.log('='.repeat(80));
    console.log(`ID: ${news.id}`);
    console.log(`Source: ${news.source}`);
    console.log(`Region: ${news.region}`);
    console.log(`\nOriginal Title: ${news.title}`);
    console.log(`Translated Title (titleZh): ${news.titleZh}`);
    console.log(`\nOriginal Summary: ${news.summary?.substring(0, 100)}...`);
    console.log(`Translated Summary (summaryZh): ${news.summaryZh?.substring(0, 100)}...`);
    console.log('='.repeat(80));
    console.log('');
  }

  // 统计翻译情况
  const stats = await db
    .select({
      source: aiNews.source,
      region: aiNews.region,
    })
    .from(aiNews)
    .where(isNotNull(aiNews.titleZh));

  console.log(`\n[Stats] Total translated news: ${stats.length}`);
  
  const bySource = stats.reduce((acc, item) => {
    acc[item.source] = (acc[item.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\n[Stats] By source:');
  Object.entries(bySource).forEach(([source, count]) => {
    console.log(`  ${source}: ${count}`);
  });

  process.exit(0);
}

checkTranslationFields().catch(console.error);
