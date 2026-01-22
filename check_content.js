import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { news } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
const db = drizzle(client);

const result = await db.select().from(news).where(eq(news.id, 518)).limit(1);

if (result.length > 0) {
  const item = result[0];
  console.log('=== 新闻 ID 518 内容分析 ===\n');
  console.log('标题:', item.title);
  console.log('\n原始内容长度:', item.content?.length || 0);
  console.log('原始内容前500字符:');
  console.log(item.content?.substring(0, 500));
  console.log('\n翻译内容长度:', item.fullContentZh?.length || 0);
  console.log('翻译内容前500字符:');
  console.log(item.fullContentZh?.substring(0, 500));
}

await client.end();
