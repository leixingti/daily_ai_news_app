import { db } from "./server/db";
import { aiNews } from "./server/db/schema";
import { desc, sql } from "drizzle-orm";

async function debugDatabase() {
  console.log("=== 检查数据库中的新闻数据 ===\n");

  // 1. 查看总新闻数量
  const totalCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(aiNews);
  console.log(`总新闻数量: ${totalCount[0].count}\n`);

  // 2. 查看最新的 10 条新闻
  const latestNews = await db
    .select({
      id: aiNews.id,
      title: aiNews.title,
      source: aiNews.source,
      publishedAt: aiNews.publishedAt,
      region: aiNews.region,
    })
    .from(aiNews)
    .orderBy(desc(aiNews.publishedAt))
    .limit(10);

  console.log("最新的 10 条新闻:");
  latestNews.forEach((news, index) => {
    console.log(`${index + 1}. [${news.source}] ${news.title.substring(0, 50)}...`);
    console.log(`   时间: ${news.publishedAt}`);
    console.log(`   地区: ${news.region}\n`);
  });

  // 3. 按源统计新闻数量
  const sourceStats = await db
    .select({
      source: aiNews.source,
      count: sql<number>`count(*)`,
    })
    .from(aiNews)
    .groupBy(aiNews.source)
    .orderBy(desc(sql`count(*)`));

  console.log("按源统计:");
  sourceStats.forEach((stat) => {
    console.log(`${stat.source}: ${stat.count} 条`);
  });

  // 4. 检查时间范围
  const timeRange = await db
    .select({
      earliest: sql<Date>`MIN(${aiNews.publishedAt})`,
      latest: sql<Date>`MAX(${aiNews.publishedAt})`,
    })
    .from(aiNews);

  console.log(`\n时间范围:`);
  console.log(`最早: ${timeRange[0].earliest}`);
  console.log(`最晚: ${timeRange[0].latest}`);

  // 5. 检查 2026-01-22 09:00 之后的新闻数量
  const cutoffDate = new Date('2026-01-22T01:00:00.000Z');
  const afterCutoff = await db
    .select({ count: sql<number>`count(*)` })
    .from(aiNews)
    .where(sql`${aiNews.publishedAt} >= ${cutoffDate}`);

  console.log(`\n北京时间 2026-01-22 09:00 之后的新闻: ${afterCutoff[0].count} 条`);

  // 6. 检查 8 个精选源的新闻数量
  const allowedSources = [
    '机器之心', '量子位', '36Kr',
    'MIT Technology Review', 'ArXiv AI', 'OpenAI Blog',
    'DeepMind Blog', 'TechCrunch'
  ];
  
  const allowedSourcesCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(aiNews)
    .where(sql`${aiNews.source} IN (${sql.join(allowedSources.map(s => sql`${s}`), sql`, `)})`);

  console.log(`8 个精选源的新闻: ${allowedSourcesCount[0].count} 条`);

  // 7. 同时满足时间和源条件的新闻数量
  const bothConditions = await db
    .select({ count: sql<number>`count(*)` })
    .from(aiNews)
    .where(
      sql`${aiNews.publishedAt} >= ${cutoffDate} AND ${aiNews.source} IN (${sql.join(allowedSources.map(s => sql`${s}`), sql`, `)})`
    );

  console.log(`同时满足时间和源条件的新闻: ${bothConditions[0].count} 条\n`);

  process.exit(0);
}

debugDatabase().catch(console.error);
