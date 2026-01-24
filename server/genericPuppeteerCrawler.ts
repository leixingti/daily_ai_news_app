/**
 * Generic Puppeteer-based crawler for Chinese AI companies
 */

import { createPage, navigateToPage } from "./browserUtils";

interface CrawledItem {
  title: string;
  url: string;
  summary: string;
  date: string;
}

/**
 * Generic crawler that tries multiple selectors to find news/blog items
 */
export async function crawlWithPuppeteer(
  url: string,
  companyName: string,
  baseUrl: string
): Promise<CrawledItem[]> {
  console.log(`[${companyName}] Starting Puppeteer crawler...`);
  const page = await createPage();
  
  try {
    const success = await navigateToPage(page, url);
    if (!success) {
      await page.close();
      return [];
    }
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try to scroll to load more content
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Extract items using page.evaluate
    const items = await page.evaluate((base) => {
      const results: Array<{title: string, url: string, summary: string, date: string}> = [];
      
      // Comprehensive list of selectors to try
      const containerSelectors = [
        'article',
        '.news-item',
        '.news-list > *',
        '.blog-post',
        '.post-item',
        '.article-item',
        '[class*="news"]',
        '[class*="blog"]',
        '[class*="post"]',
        '[class*="article"]',
        'a[href*="/news/"]',
        'a[href*="/blog/"]',
        'a[href*="/article/"]',
        '.list-item',
        '[class*="card"]',
      ];
      
      for (const selector of containerSelectors) {
        try {
          const elements = document.querySelectorAll(selector);
          if (elements.length === 0) continue;
          
          elements.forEach((el, index) => {
            if (index >= 15) return; // Get more items to filter later
            
            // Try to find title
            const titleSelectors = ['h1', 'h2', 'h3', 'h4', 'h5', '.title', '[class*="title"]'];
            let title = '';
            for (const ts of titleSelectors) {
              const titleEl = el.querySelector(ts);
              if (titleEl?.textContent?.trim()) {
                title = titleEl.textContent.trim();
                break;
              }
            }
            
            // Fallback: use element text content
            if (!title) {
              const text = el.textContent?.trim() || '';
              title = text.split('\n')[0].trim();
            }
            
            // Try to find link
            let url = '';
            const linkEl = el.querySelector('a') || (el as HTMLAnchorElement);
            if (linkEl && 'href' in linkEl) {
              url = linkEl.href || linkEl.getAttribute('href') || '';
            }
            
            // Try to find summary
            const summarySelectors = ['p', '.summary', '.excerpt', '.desc', '.description', '[class*="desc"]', '[class*="summary"]'];
            let summary = '';
            for (const ss of summarySelectors) {
              const summaryEl = el.querySelector(ss);
              if (summaryEl?.textContent?.trim()) {
                summary = summaryEl.textContent.trim();
                break;
              }
            }
            
            // Try to find date
            const dateSelectors = ['time', '.date', '.time', '[class*="date"]', '[class*="time"]'];
            let date = '';
            for (const ds of dateSelectors) {
              const dateEl = el.querySelector(ds);
              if (dateEl?.textContent?.trim()) {
                date = dateEl.textContent.trim();
                break;
              }
            }
            
            // Validate and add result
            if (title && url && title.length > 5 && title.length < 200) {
              // Filter out navigation links and other non-news items
              const lowerTitle = title.toLowerCase();
              if (!lowerTitle.includes('cookie') && 
                  !lowerTitle.includes('privacy') && 
                  !lowerTitle.includes('terms') &&
                  !lowerTitle.includes('login') &&
                  !lowerTitle.includes('sign in')) {
                results.push({ title, url, summary, date });
              }
            }
          });
          
          // If we found enough results, stop trying other selectors
          if (results.length >= 5) break;
        } catch (e) {
          // Continue to next selector
        }
      }
      
      return results.slice(0, 10); // Return top 10
    }, baseUrl);
    
    console.log(`[${companyName}] Found ${items.length} items`);
    return items;
    
  } catch (error) {
    console.error(`[${companyName}] Crawler failed:`, error);
    return [];
  } finally {
    await page.close();
  }
}
