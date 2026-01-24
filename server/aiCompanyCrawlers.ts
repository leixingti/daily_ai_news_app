/**
 * AI Company News Crawlers
 * Crawls news from top AI companies' official websites
 */

import * as cheerio from "cheerio";
import { getDb } from "./db";
import { aiNews } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import Parser from "rss-parser";
import { createPage, navigateToPage, extractTextContent, extractLinks, waitForSelector } from "./browserUtils";
import { crawlWithPuppeteer } from "./genericPuppeteerCrawler";

const rssParser = new Parser();

interface NewsItem {
  title: string;
  sourceUrl: string;
  publishedAt: Date;
  summary: string;
  content: string;
  source: string;
  region: "international" | "domestic";
  category: "manufacturer" | "product" | "industry" | "manufacturer";
}

/**
 * Fetch and parse RSS feed
 */
async function fetchRSS(url: string): Promise<any[]> {
  try {
    const feed = await rssParser.parseURL(url);
    return feed.items || [];
  } catch (error) {
    console.error(`[RSS] Failed to fetch ${url}:`, error);
    return [];
  }
}

/**
 * Fetch HTML page
 */
async function fetchHTML(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`[HTML] Failed to fetch ${url}:`, error);
    return "";
  }
}

/**
 * Save news to database
 */
async function saveNews(news: NewsItem): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[DB] Database not available for saving news");
    return;
  }
  
  try {
    // Check if news already exists
    const existing = await db
      .select()
      .from(aiNews)
      .where(eq(aiNews.sourceUrl, news.sourceUrl))
      .limit(1);

    if (existing.length > 0) {
      console.log(`[DB] News already exists: ${news.title}`);
      return;
    }

    // Generate content hash
    const contentHash = Buffer.from(news.sourceUrl).toString("hex").substring(0, 64);

    // Insert new news
    await db.insert(aiNews).values({
      title: news.title,
      sourceUrl: news.sourceUrl,
      publishedAt: news.publishedAt,
      summary: news.summary.substring(0, 500),
      content: news.content || news.summary,
      source: news.source,
      region: news.region,
      category: news.category,
      contentHash: contentHash,
      translationStatus: news.region === "international" ? 1 : 0,
    });

    console.log(`[DB] Saved news: ${news.title}`);
  } catch (error) {
    console.error(`[DB] Failed to save news:`, error);
  }
}

// ============================================================================
// International AI Companies
// ============================================================================

/**
 * OpenAI Blog Crawler
 */
export async function crawlOpenAI(): Promise<void> {
  console.log("[OpenAI] Starting crawler...");
  
  try {
    const items = await fetchRSS("https://openai.com/news/rss.xml");
    
    for (const item of items.slice(0, 10)) {
      const news: NewsItem = {
        title: item.title || "",
        sourceUrl: item.link || "",
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        summary: item.contentSnippet || item.content || "",
        content: item.content || item.contentSnippet || "",
        source: "OpenAI",
        region: "international",
        category: "manufacturer" as "manufacturer",
      };
      
      await saveNews(news);
    }
    
    console.log(`[OpenAI] Crawled ${items.length} news items`);
  } catch (error) {
    console.error("[OpenAI] Crawler failed:", error);
  }
}

/**
 * Google DeepMind Blog Crawler
 */
export async function crawlDeepMind(): Promise<void> {
  console.log("[DeepMind] Starting crawler...");
  
  try {
    const html = await fetchHTML("https://deepmind.google/discover/blog/");
    if (!html) return;
    
    const $ = cheerio.load(html);
    const newsItems: NewsItem[] = [];
    
    // Parse blog posts (adjust selectors based on actual HTML structure)
    $("article, .blog-post, .post-item").slice(0, 10).each((_, element) => {
      const $el = $(element);
      const title = $el.find("h2, h3, .title").first().text().trim();
      const url = $el.find("a").first().attr("href") || "";
      const summary = $el.find("p, .summary, .excerpt").first().text().trim();
      const dateStr = $el.find("time, .date").first().attr("datetime") || $el.find("time, .date").first().text();
      
      if (title && url) {
        newsItems.push({
          title,
          sourceUrl: url.startsWith("http") ? url : `https://deepmind.google${url}`,
          publishedAt: dateStr ? new Date(dateStr) : new Date(),
          summary: summary.substring(0, 500),
          content: summary,
          source: "Google DeepMind",
          region: "international",
          category: "manufacturer" as "manufacturer",
        });
      }
    });
    
    for (const news of newsItems) {
      await saveNews(news);
    }
    
    console.log(`[DeepMind] Crawled ${newsItems.length} news items`);
  } catch (error) {
    console.error("[DeepMind] Crawler failed:", error);
  }
}

/**
 * Anthropic News Crawler
 */
export async function crawlAnthropic(): Promise<void> {
  console.log("[Anthropic] Starting crawler...");
  
  try {
    const html = await fetchHTML("https://www.anthropic.com/news");
    if (!html) return;
    
    const $ = cheerio.load(html);
    const newsItems: NewsItem[] = [];
    
    $("article, .news-item, .post").slice(0, 10).each((_, element) => {
      const $el = $(element);
      const title = $el.find("h2, h3, .title").first().text().trim();
      const url = $el.find("a").first().attr("href") || "";
      const summary = $el.find("p, .summary").first().text().trim();
      const dateStr = $el.find("time, .date").first().attr("datetime") || $el.find("time, .date").first().text();
      
      if (title && url) {
        newsItems.push({
          title,
          sourceUrl: url.startsWith("http") ? url : `https://www.anthropic.com${url}`,
          publishedAt: dateStr ? new Date(dateStr) : new Date(),
          summary: summary.substring(0, 500),
          content: summary,
          source: "Anthropic",
          region: "international",
          category: "manufacturer" as "manufacturer",
        });
      }
    });
    
    for (const news of newsItems) {
      await saveNews(news);
    }
    
    console.log(`[Anthropic] Crawled ${newsItems.length} news items`);
  } catch (error) {
    console.error("[Anthropic] Crawler failed:", error);
  }
}

/**
 * Meta AI Blog Crawler
 */
export async function crawlMetaAI(): Promise<void> {
  console.log("[Meta AI] Starting crawler...");
  
  try {
    const html = await fetchHTML("https://ai.meta.com/blog/");
    if (!html) return;
    
    const $ = cheerio.load(html);
    const newsItems: NewsItem[] = [];
    
    $("article, .blog-post, .post-item").slice(0, 10).each((_, element) => {
      const $el = $(element);
      const title = $el.find("h2, h3, .title, a").first().text().trim();
      const url = $el.find("a").first().attr("href") || "";
      const summary = $el.find("p, .summary, .excerpt").first().text().trim();
      const dateStr = $el.find("time, .date").first().attr("datetime") || $el.find("time, .date").first().text();
      
      if (title && url) {
        newsItems.push({
          title,
          sourceUrl: url.startsWith("http") ? url : `https://ai.meta.com${url}`,
          publishedAt: dateStr ? new Date(dateStr) : new Date(),
          summary: summary.substring(0, 500),
          content: summary,
          source: "Meta AI",
          region: "international",
          category: "manufacturer" as "manufacturer",
        });
      }
    });
    
    for (const news of newsItems) {
      await saveNews(news);
    }
    
    console.log(`[Meta AI] Crawled ${newsItems.length} news items`);
  } catch (error) {
    console.error("[Meta AI] Crawler failed:", error);
  }
}

/**
 * Hugging Face Blog Crawler
 */
export async function crawlHuggingFace(): Promise<void> {
  console.log("[Hugging Face] Starting crawler...");
  
  try {
    const html = await fetchHTML("https://huggingface.co/blog");
    if (!html) return;
    
    const $ = cheerio.load(html);
    const newsItems: NewsItem[] = [];
    
    $("article, .blog-post, a[href^='/blog/']").slice(0, 10).each((_, element) => {
      const $el = $(element);
      const title = $el.find("h2, h3, .title").first().text().trim() || $el.text().trim();
      const url = $el.attr("href") || $el.find("a").first().attr("href") || "";
      const summary = $el.find("p, .summary").first().text().trim();
      const dateStr = $el.find("time, .date").first().attr("datetime") || $el.find("time, .date").first().text();
      
      if (title && url && !url.includes("#")) {
        newsItems.push({
          title,
          sourceUrl: url.startsWith("http") ? url : `https://huggingface.co${url}`,
          publishedAt: dateStr ? new Date(dateStr) : new Date(),
          summary: summary.substring(0, 500),
          content: summary,
          source: "Hugging Face",
          region: "international",
          category: "manufacturer",
        });
      }
    });
    
    for (const news of newsItems) {
      await saveNews(news);
    }
    
    console.log(`[Hugging Face] Crawled ${newsItems.length} news items`);
  } catch (error) {
    console.error("[Hugging Face] Crawler failed:", error);
  }
}

// ============================================================================
// Domestic AI Companies
// ============================================================================

/**
 * 智谱AI (ChatGLM) Crawler - Puppeteer version
 */
export async function crawlZhipuAI(): Promise<void> {
  console.log("[智谱AI] Starting crawler...");
  const page = await createPage();
  
  try {
    const success = await navigateToPage(page, "https://www.zhipuai.cn/news");
    if (!success) {
      await page.close();
      return;
    }
    
    // Wait for news content to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const newsItems: NewsItem[] = [];
    
    // Extract news items using page.evaluate
    const items = await page.evaluate(() => {
      const results: Array<{title: string, url: string, summary: string, date: string}> = [];
      
      // Try multiple selectors
      const selectors = [
        'article',
        '.news-item',
        '.news-list > div',
        '[class*="news"]',
        '[class*="article"]',
      ];
      
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          elements.forEach((el, index) => {
            if (index >= 10) return;
            
            const titleEl = el.querySelector('h1, h2, h3, h4, .title, [class*="title"]');
            const linkEl = el.querySelector('a');
            const summaryEl = el.querySelector('p, .summary, .desc, [class*="desc"]');
            const dateEl = el.querySelector('time, .date, .time, [class*="date"]');
            
            const title = titleEl?.textContent?.trim() || '';
            const url = linkEl?.getAttribute('href') || '';
            const summary = summaryEl?.textContent?.trim() || '';
            const date = dateEl?.textContent?.trim() || '';
            
            if (title && url) {
              results.push({ title, url, summary, date });
            }
          });
          
          if (results.length > 0) break;
        }
      }
      
      return results;
    });
    
    for (const item of items) {
      newsItems.push({
        title: item.title,
        sourceUrl: item.url.startsWith('http') ? item.url : `https://www.zhipuai.cn${item.url}`,
        publishedAt: item.date ? new Date(item.date) : new Date(),
        summary: item.summary.substring(0, 500) || item.title,
        content: item.summary || item.title,
        source: "智谱AI",
        region: "domestic",
        category: "manufacturer",
      });
    }
    
    for (const news of newsItems) {
      await saveNews(news);
    }
    
    console.log(`[智谱AI] Crawled ${newsItems.length} news items`);
  } catch (error) {
    console.error("[智谱AI] Crawler failed:", error);
  } finally {
    await page.close();
  }
}

/**
 * 月之暗面 (Moonshot/Kimi) Crawler - Puppeteer version
 */
export async function crawlMoonshot(): Promise<void> {
  console.log("[月之暗面] Starting crawler...");
  const page = await createPage();
  
  try {
    const success = await navigateToPage(page, "https://www.moonshot.cn/blog");
    if (!success) {
      await page.close();
      return;
    }
    
    // Wait for blog content to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const newsItems: NewsItem[] = [];
    
    // Extract blog posts using page.evaluate
    const items = await page.evaluate(() => {
      const results: Array<{title: string, url: string, summary: string, date: string}> = [];
      
      // Try multiple selectors for blog posts
      const selectors = [
        'article',
        '.blog-post',
        '.post-item',
        '[class*="blog"]',
        '[class*="post"]',
        'a[href*="/blog/"]',
      ];
      
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          elements.forEach((el, index) => {
            if (index >= 10) return;
            
            const titleEl = el.querySelector('h1, h2, h3, h4, .title, [class*="title"]');
            const linkEl = el.querySelector('a') || (el as HTMLAnchorElement);
            const summaryEl = el.querySelector('p, .summary, .excerpt, .desc, [class*="desc"]');
            const dateEl = el.querySelector('time, .date, .time, [class*="date"]');
            
            const title = titleEl?.textContent?.trim() || el.textContent?.trim().split('\n')[0] || '';
            const url = linkEl?.getAttribute?.('href') || '';
            const summary = summaryEl?.textContent?.trim() || '';
            const date = dateEl?.textContent?.trim() || '';
            
            if (title && url && title.length > 5) {
              results.push({ title, url, summary, date });
            }
          });
          
          if (results.length > 0) break;
        }
      }
      
      return results;
    });
    
    for (const item of items) {
      newsItems.push({
        title: item.title,
        sourceUrl: item.url.startsWith('http') ? item.url : `https://www.moonshot.cn${item.url}`,
        publishedAt: item.date ? new Date(item.date) : new Date(),
        summary: item.summary.substring(0, 500) || item.title,
        content: item.summary || item.title,
        source: "月之暗面",
        region: "domestic",
        category: "manufacturer",
      });
    }
    
    for (const news of newsItems) {
      await saveNews(news);
    }
    
    console.log(`[月之暗面] Crawled ${newsItems.length} news items`);
  } catch (error) {
    console.error("[月之暗面] Crawler failed:", error);
  } finally {
    await page.close();
  }
}

/**
 * 百度AI Crawler - Puppeteer version
 */
export async function crawlBaiduAI(): Promise<void> {
  try {
    const items = await crawlWithPuppeteer(
      "https://ai.baidu.com/news",
      "百度AI",
      "https://ai.baidu.com"
    );
    
    for (const item of items) {
      await saveNews({
        title: item.title,
        sourceUrl: item.url.startsWith('http') ? item.url : `https://ai.baidu.com${item.url}`,
        publishedAt: item.date ? new Date(item.date) : new Date(),
        summary: item.summary.substring(0, 500) || item.title,
        content: item.summary || item.title,
        source: "百度AI",
        region: "domestic",
        category: "manufacturer",
      });
    }
    
    console.log(`[百度AI] Crawled ${items.length} news items`);
  } catch (error) {
    console.error("[百度AI] Crawler failed:", error);
  }
}

/**
 * 阿里云AI Crawler - Puppeteer version
 */
export async function crawlAliyunAI(): Promise<void> {
  try {
    const items = await crawlWithPuppeteer(
      "https://www.aliyun.com/solution/ai",
      "阿里云AI",
      "https://www.aliyun.com"
    );
    
    for (const item of items) {
      await saveNews({
        title: item.title,
        sourceUrl: item.url.startsWith('http') ? item.url : `https://www.aliyun.com${item.url}`,
        publishedAt: item.date ? new Date(item.date) : new Date(),
        summary: item.summary.substring(0, 500) || item.title,
        content: item.summary || item.title,
        source: "阿里云AI",
        region: "domestic",
        category: "manufacturer",
      });
    }
    
    console.log(`[阿里云AI] Crawled ${items.length} news items`);
  } catch (error) {
    console.error("[阿里云AI] Crawler failed:", error);
  }
}

/**
 * 字节跳动AI Crawler - Puppeteer version
 */
export async function crawlByteDanceAI(): Promise<void> {
  try {
    const items = await crawlWithPuppeteer(
      "https://ailab.bytedance.com/",
      "字节跳动AI",
      "https://ailab.bytedance.com"
    );
    
    for (const item of items) {
      await saveNews({
        title: item.title,
        sourceUrl: item.url.startsWith('http') ? item.url : `https://ailab.bytedance.com${item.url}`,
        publishedAt: item.date ? new Date(item.date) : new Date(),
        summary: item.summary.substring(0, 500) || item.title,
        content: item.summary || item.title,
        source: "字节跳动AI",
        region: "domestic",
        category: "manufacturer",
      });
    }
    
    console.log(`[字节跳动AI] Crawled ${items.length} news items`);
  } catch (error) {
    console.error("[字节跳动AI] Crawler failed:", error);
  }
}

// ============================================================================
// Main Crawler Function
// ============================================================================

/**
 * Run all AI company crawlers
 */
export async function runAllAICompanyCrawlers(): Promise<void> {
  console.log("[AI Companies] Starting all crawlers...");
  
  const startTime = Date.now();
  
  // Run international crawlers
  await Promise.allSettled([
    crawlOpenAI(),
    crawlDeepMind(),
    crawlAnthropic(),
    crawlMetaAI(),
    crawlHuggingFace(),
    crawlMicrosoftAI(),
    crawlNVIDIAAI(),
    crawlAWSAI(),
    crawlCohereAI(),
    crawlMistralAI(),
  ]);
  
  // Run domestic crawlers - temporarily disabled
  await Promise.allSettled([
    //     crawlZhipuAI(),
    //     crawlMoonshot(),
    //     crawlBaiduAI(),
    //     crawlAliyunAI(),
    //     crawlByteDanceAI(),
    //     crawlSenseTime(),
    //     crawlMegvii(),
    //     crawl4Paradigm(),
    //     crawlCloudWalk(),
    //     crawliFlytek(),
  ]);
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[AI Companies] All crawlers completed in ${duration}s`);
}

// ============================================================================
// Additional International AI Companies
// ============================================================================

/**
 * Microsoft AI Blog Crawler
 */
export async function crawlMicrosoftAI(): Promise<void> {
  console.log("[Microsoft AI] Starting crawler...");
  
  try {
    const html = await fetchHTML("https://www.microsoft.com/en-us/ai/blog/");
    const $ = cheerio.load(html);
    
    const newsItems: NewsItem[] = [];
    
    $("article, .blog-post, .post-item").each((_, element) => {
      const $el = $(element);
      const title = $el.find("h2, h3, .title").first().text().trim();
      const url = $el.find("a").first().attr("href") || "";
      const summary = $el.find("p, .summary, .excerpt").first().text().trim();
      const dateStr = $el.find("time, .date").first().attr("datetime") || $el.find("time, .date").first().text();
      
      if (title && url) {
        newsItems.push({
          title,
          sourceUrl: url.startsWith("http") ? url : `https://www.microsoft.com${url}`,
          publishedAt: dateStr ? new Date(dateStr) : new Date(),
          summary: summary.substring(0, 500),
          content: summary,
          source: "Microsoft AI",
          region: "international",
          category: "manufacturer" as "manufacturer",
        });
      }
    });
    
    for (const news of newsItems.slice(0, 10)) {
      await saveNews(news);
    }
    
    console.log(`[Microsoft AI] Crawled ${newsItems.length} news items`);
  } catch (error) {
    console.error("[Microsoft AI] Crawler failed:", error);
  }
}

/**
 * NVIDIA AI Blog Crawler
 */
export async function crawlNVIDIAAI(): Promise<void> {
  console.log("[NVIDIA AI] Starting crawler...");
  
  try {
    const html = await fetchHTML("https://blogs.nvidia.com/blog/category/deep-learning/");
    const $ = cheerio.load(html);
    
    const newsItems: NewsItem[] = [];
    
    $("article, .post, .blog-post").each((_, element) => {
      const $el = $(element);
      const title = $el.find("h2, h3, .entry-title").first().text().trim();
      const url = $el.find("a").first().attr("href") || "";
      const summary = $el.find("p, .excerpt, .entry-summary").first().text().trim();
      const dateStr = $el.find("time, .date").first().attr("datetime") || $el.find("time, .date").first().text();
      
      if (title && url) {
        newsItems.push({
          title,
          sourceUrl: url.startsWith("http") ? url : `https://blogs.nvidia.com${url}`,
          publishedAt: dateStr ? new Date(dateStr) : new Date(),
          summary: summary.substring(0, 500),
          content: summary,
          source: "NVIDIA AI",
          region: "international",
          category: "manufacturer" as "manufacturer",
        });
      }
    });
    
    for (const news of newsItems.slice(0, 10)) {
      await saveNews(news);
    }
    
    console.log(`[NVIDIA AI] Crawled ${newsItems.length} news items`);
  } catch (error) {
    console.error("[NVIDIA AI] Crawler failed:", error);
  }
}

/**
 * AWS AI Blog Crawler
 */
export async function crawlAWSAI(): Promise<void> {
  console.log("[AWS AI] Starting crawler...");
  
  try {
    const html = await fetchHTML("https://aws.amazon.com/blogs/aws/category/artificial-intelligence/");
    const $ = cheerio.load(html);
    
    const newsItems: NewsItem[] = [];
    
    $("article, .blog-post, .post").each((_, element) => {
      const $el = $(element);
      const title = $el.find("h2, h3, .blog-post-title").first().text().trim();
      const url = $el.find("a").first().attr("href") || "";
      const summary = $el.find("p, .blog-post-excerpt").first().text().trim();
      const dateStr = $el.find("time, .blog-post-date").first().attr("datetime") || $el.find("time, .blog-post-date").first().text();
      
      if (title && url) {
        newsItems.push({
          title,
          sourceUrl: url.startsWith("http") ? url : `https://aws.amazon.com${url}`,
          publishedAt: dateStr ? new Date(dateStr) : new Date(),
          summary: summary.substring(0, 500),
          content: summary,
          source: "AWS AI",
          region: "international",
          category: "manufacturer" as "manufacturer",
        });
      }
    });
    
    for (const news of newsItems.slice(0, 10)) {
      await saveNews(news);
    }
    
    console.log(`[AWS AI] Crawled ${newsItems.length} news items`);
  } catch (error) {
    console.error("[AWS AI] Crawler failed:", error);
  }
}

/**
 * Cohere AI Blog Crawler
 */
export async function crawlCohereAI(): Promise<void> {
  console.log("[Cohere AI] Starting crawler...");
  
  try {
    const html = await fetchHTML("https://cohere.com/blog");
    const $ = cheerio.load(html);
    
    const newsItems: NewsItem[] = [];
    
    $("article, .blog-card, .post-card").each((_, element) => {
      const $el = $(element);
      const title = $el.find("h2, h3, .title").first().text().trim();
      const url = $el.find("a").first().attr("href") || "";
      const summary = $el.find("p, .excerpt, .description").first().text().trim();
      const dateStr = $el.find("time, .date").first().attr("datetime") || $el.find("time, .date").first().text();
      
      if (title && url) {
        newsItems.push({
          title,
          sourceUrl: url.startsWith("http") ? url : `https://cohere.com${url}`,
          publishedAt: dateStr ? new Date(dateStr) : new Date(),
          summary: summary.substring(0, 500),
          content: summary,
          source: "Cohere",
          region: "international",
          category: "manufacturer" as "manufacturer",
        });
      }
    });
    
    for (const news of newsItems.slice(0, 10)) {
      await saveNews(news);
    }
    
    console.log(`[Cohere AI] Crawled ${newsItems.length} news items`);
  } catch (error) {
    console.error("[Cohere AI] Crawler failed:", error);
  }
}

/**
 * Mistral AI News Crawler
 */
export async function crawlMistralAI(): Promise<void> {
  console.log("[Mistral AI] Starting crawler...");
  
  try {
    const html = await fetchHTML("https://mistral.ai/news");
    const $ = cheerio.load(html);
    
    const newsItems: NewsItem[] = [];
    
    $("article, .news-item, .post").each((_, element) => {
      const $el = $(element);
      const title = $el.find("h2, h3, .title").first().text().trim();
      const url = $el.find("a").first().attr("href") || "";
      const summary = $el.find("p, .excerpt, .description").first().text().trim();
      const dateStr = $el.find("time, .date").first().attr("datetime") || $el.find("time, .date").first().text();
      
      if (title && url) {
        newsItems.push({
          title,
          sourceUrl: url.startsWith("http") ? url : `https://mistral.ai${url}`,
          publishedAt: dateStr ? new Date(dateStr) : new Date(),
          summary: summary.substring(0, 500),
          content: summary,
          source: "Mistral AI",
          region: "international",
          category: "manufacturer" as "manufacturer",
        });
      }
    });
    
    for (const news of newsItems.slice(0, 10)) {
      await saveNews(news);
    }
    
    console.log(`[Mistral AI] Crawled ${newsItems.length} news items`);
  } catch (error) {
    console.error("[Mistral AI] Crawler failed:", error);
  }
}

// ============================================================================
// Additional Domestic AI Companies
// ============================================================================

/**
 * SenseTime (商汤科技) News Crawler - Puppeteer version
 */
export async function crawlSenseTime(): Promise<void> {
  try {
    const items = await crawlWithPuppeteer(
      "https://www.sensetime.com/cn/news-press-release",
      "商汤科技",
      "https://www.sensetime.com"
    );
    
    for (const item of items) {
      await saveNews({
        title: item.title,
        sourceUrl: item.url.startsWith('http') ? item.url : `https://www.sensetime.com${item.url}`,
        publishedAt: item.date ? new Date(item.date) : new Date(),
        summary: item.summary.substring(0, 500) || item.title,
        content: item.summary || item.title,
        source: "商汤科技",
        region: "domestic",
        category: "manufacturer",
      });
    }
    
    console.log(`[商汤科技] Crawled ${items.length} news items`);
  } catch (error) {
    console.error("[商汤科技] Crawler failed:", error);
  }
}

/**
 * Megvii (旷视科技) News Crawler - Puppeteer version
 */
export async function crawlMegvii(): Promise<void> {
  try {
    const items = await crawlWithPuppeteer(
      "https://www.megvii.com/news/",
      "旷视科技",
      "https://www.megvii.com"
    );
    
    for (const item of items) {
      await saveNews({
        title: item.title,
        sourceUrl: item.url.startsWith('http') ? item.url : `https://www.megvii.com${item.url}`,
        publishedAt: item.date ? new Date(item.date) : new Date(),
        summary: item.summary.substring(0, 500) || item.title,
        content: item.summary || item.title,
        source: "旷视科技",
        region: "domestic",
        category: "manufacturer",
      });
    }
    
    console.log(`[旷视科技] Crawled ${items.length} news items`);
  } catch (error) {
    console.error("[旷视科技] Crawler failed:", error);
  }
}

/**
 * 4Paradigm (第四范式) News Crawler - Puppeteer version
 */
export async function crawl4Paradigm(): Promise<void> {
  try {
    const items = await crawlWithPuppeteer(
      "https://www.4paradigm.com/about/news.html",
      "第四范式",
      "https://www.4paradigm.com"
    );
    
    for (const item of items) {
      await saveNews({
        title: item.title,
        sourceUrl: item.url.startsWith('http') ? item.url : `https://www.4paradigm.com${item.url}`,
        publishedAt: item.date ? new Date(item.date) : new Date(),
        summary: item.summary.substring(0, 500) || item.title,
        content: item.summary || item.title,
        source: "第四范式",
        region: "domestic",
        category: "manufacturer",
      });
    }
    
    console.log(`[第四范式] Crawled ${items.length} news items`);
  } catch (error) {
    console.error("[第四范式] Crawler failed:", error);
  }
}

/**
 * CloudWalk (云从科技) News Crawler - Puppeteer version
 */
export async function crawlCloudWalk(): Promise<void> {
  try {
    const items = await crawlWithPuppeteer(
      "https://www.cloudwalk.com/",
      "云从科技",
      "https://www.cloudwalk.com"
    );
    
    for (const item of items) {
      await saveNews({
        title: item.title,
        sourceUrl: item.url.startsWith('http') ? item.url : `https://www.cloudwalk.com${item.url}`,
        publishedAt: item.date ? new Date(item.date) : new Date(),
        summary: item.summary.substring(0, 500) || item.title,
        content: item.summary || item.title,
        source: "云从科技",
        region: "domestic",
        category: "manufacturer",
      });
    }
    
    console.log(`[云从科技] Crawled ${items.length} news items`);
  } catch (error) {
    console.error("[云从科技] Crawler failed:", error);
  }
}

/**
 * iFlytek (科大讯飞) News Crawler - Puppeteer version
 */
export async function crawliFlytek(): Promise<void> {
  try {
    const items = await crawlWithPuppeteer(
      "https://www.iflytek.com/",
      "科大讯飞",
      "https://www.iflytek.com"
    );
    
    for (const item of items) {
      await saveNews({
        title: item.title,
        sourceUrl: item.url.startsWith('http') ? item.url : `https://www.iflytek.com${item.url}`,
        publishedAt: item.date ? new Date(item.date) : new Date(),
        summary: item.summary.substring(0, 500) || item.title,
        content: item.summary || item.title,
        source: "科大讯飞",
        region: "domestic",
        category: "manufacturer",
      });
    }
    
    console.log(`[科大讯飞] Crawled ${items.length} news items`);
  } catch (error) {
    console.error("[科大讯飞] Crawler failed:", error);
  }
}
