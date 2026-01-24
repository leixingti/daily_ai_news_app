/**
 * Check translation status in database
 */

import { getDb } from './server/db';
import { aiNews } from './drizzle/schema';
import { eq, and } from 'drizzle-orm';

async function checkTranslationStatus() {
  console.log('=== Checking Translation Status ===\n');
  
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    process.exit(1);
  }
  
  // Check total international news
  const allInternationalNews = await db
    .select()
    .from(aiNews)
    .where(eq(aiNews.region, 'international'))
    .limit(50);
  
  console.log(`Total international news (last 50): ${allInternationalNews.length}`);
  
  // Group by translation status
  const statusCounts = {
    pending: 0,    // status = 1
    translated: 0, // status = 2
    failed: 0,     // status = 3
    notSet: 0,     // status = 0 or null
  };
  
  allInternationalNews.forEach(news => {
    if (news.translationStatus === 1) statusCounts.pending++;
    else if (news.translationStatus === 2) statusCounts.translated++;
    else if (news.translationStatus === 3) statusCounts.failed++;
    else statusCounts.notSet++;
  });
  
  console.log('\nTranslation Status Breakdown:');
  console.log(`  Pending (status=1): ${statusCounts.pending}`);
  console.log(`  Translated (status=2): ${statusCounts.translated}`);
  console.log(`  Failed (status=3): ${statusCounts.failed}`);
  console.log(`  Not Set (status=0/null): ${statusCounts.notSet}`);
  
  // Show sample pending news
  const pendingNews = allInternationalNews.filter(n => n.translationStatus === 1);
  if (pendingNews.length > 0) {
    console.log('\n=== Sample Pending News ===');
    pendingNews.slice(0, 3).forEach(news => {
      console.log(`\nID: ${news.id}`);
      console.log(`Title: ${news.title}`);
      console.log(`Source: ${news.source}`);
      console.log(`Published: ${news.publishedAt}`);
      console.log(`Translation Status: ${news.translationStatus}`);
    });
  }
  
  // Show sample translated news
  const translatedNews = allInternationalNews.filter(n => n.translationStatus === 2);
  if (translatedNews.length > 0) {
    console.log('\n=== Sample Translated News ===');
    translatedNews.slice(0, 2).forEach(news => {
      console.log(`\nID: ${news.id}`);
      console.log(`Title: ${news.title}`);
      console.log(`Source: ${news.source}`);
      console.log(`Translation Status: ${news.translationStatus}`);
    });
  }
  
  // Check environment variable
  console.log('\n=== Environment Check ===');
  console.log(`BUILT_IN_FORGE_API_KEY set: ${process.env.BUILT_IN_FORGE_API_KEY ? 'Yes' : 'No'}`);
  console.log(`BUILT_IN_FORGE_API_URL: ${process.env.BUILT_IN_FORGE_API_URL || 'Not set (will use DeepSeek default)'}`);
  
  process.exit(0);
}

checkTranslationStatus();
