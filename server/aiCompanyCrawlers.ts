/**
 * AI Company News Crawlers
 * Crawls news from top AI companies' official websites
 */

import * as cheerio from "cheerio";
import { getDb } from "./db";
import { aiNews } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import Parser from "rss-parser";

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
 * 智谱AI (ChatGLM) Crawler
 */
export async function crawlZhipuAI(): Promise<void> {
  console.log("[智谱AI] Starting crawler...");
  
  try {
    const html = await fetchHTML("https://www.zhipuai.cn/news");
    if (!html) return;
    
    const $ = cheerio.load(html);
    const newsItems: NewsItem[] = [];
    
    $("article, .news-item, .post, a[href*='/news/']").slice(0, 10).each((_, element) => {
      const $el = $(element);
      const title = $el.find("h2, h3, .title").first().text().trim() || $el.text().trim();
      const url = $el.attr("href") || $el.find("a").first().attr("href") || "";
      const summary = $el.find("p, .summary, .desc").first().text().trim();
      const dateStr = $el.find("time, .date, .time").first().text();
      
      if (title && url) {
        newsItems.push({
          title,
          sourceUrl: url.startsWith("http") ? url : `https://www.zhipuai.cn${url}`,
          publishedAt: dateStr ? new Date(dateStr) : new Date(),
          summary: summary.substring(0, 500),
          content: summary,
          source: "智谱AI",
          region: "domestic",
          category: "manufacturer",
        });
      }
    });
    
    for (const news of newsItems) {
      await saveNews(news);
    }
    
    console.log(`[智谱AI] Crawled ${newsItems.length} news items`);
  } catch (error) {
    console.error("[智谱AI] Crawler failed:", error);
  }
}

/**
 * 月之暗面 (Moonshot/Kimi) Crawler
 */
export async function crawlMoonshot(): Promise<void> {
  console.log("[月之暗面] Starting crawler...");
  
  try {
    const html = await fetchHTML("https://www.moonshot.cn/blog");
    if (!html) return;
    
    const $ = cheerio.load(html);
    const newsItems: NewsItem[] = [];
    
    $("article, .blog-post, .post-item, a[href*='/blog/']").slice(0, 10).each((_, element) => {
      const $el = $(element);
      const title = $el.find("h2, h3, .title").first().text().trim() || $el.text().trim();
      const url = $el.attr("href") || $el.find("a").first().attr("href") || "";
      const summary = $el.find("p, .summary, .excerpt").first().text().trim();
      const dateStr = $el.find("time, .date").first().text();
      
      if (title && url) {
        newsItems.push({
          title,
          sourceUrl: url.startsWith("http") ? url : `https://www.moonshot.cn${url}`,
          publishedAt: dateStr ? new Date(dateStr) : new Date(),
          summary: summary.substring(0, 500),
          content: summary,
          source: "月之暗面",
          region: "domestic",
          category: "manufacturer",
        });
      }
    });
    
    for (const news of newsItems) {
      await saveNews(news);
    }
    
    console.log(`[月之暗面] Crawled ${newsItems.length} news items`);
  } catch (error) {
    console.error("[月之暗面] Crawler failed:", error);
  }
}

/**
 * 百度AI Crawler
 */
export async function crawlBaiduAI(): Promise<void> {
  console.log("[百度AI] Starting crawler...");
  
  try {
    const html = await fetchHTML("https://ai.baidu.com/news");
    if (!html) return;
    
    const $ = cheerio.load(html);
    const newsItems: NewsItem[] = [];
    
    $("article, .news-item, .news-list li, a[href*='/news/']").slice(0, 10).each((_, element) => {
      const $el = $(element);
      const title = $el.find("h2, h3, .title, a").first().text().trim() || $el.text().trim();
      const url = $el.attr("href") || $el.find("a").first().attr("href") || "";
      const summary = $el.find("p, .summary, .desc").first().text().trim();
      const dateStr = $el.find("time, .date, .time").first().text();
      
      if (title && url) {
        newsItems.push({
          title,
          sourceUrl: url.startsWith("http") ? url : `https://ai.baidu.com${url}`,
          publishedAt: dateStr ? new Date(dateStr) : new Date(),
          summary: summary.substring(0, 500),
          content: summary,
          source: "百度AI",
          region: "domestic",
          category: "manufacturer",
        });
      }
    });
    
    for (const news of newsItems) {
      await saveNews(news);
    }
    
    console.log(`[百度AI] Crawled ${newsItems.length} news items`);
  } catch (error) {
    console.error("[百度AI] Crawler failed:", error);
  }
}

/**
 * 阿里云AI Crawler
 */
export async function crawlAliyunAI(): Promise<void> {
  console.log("[阿里云AI] Starting crawler...");
  
  try {
    // Try Alibaba Cloud AI blog
    const html = await fetchHTML("https://www.aliyun.com/solution/ai");
    if (!html) return;
    
    const $ = cheerio.load(html);
    const newsItems: NewsItem[] = [];
    
    $("article, .news-item, .article-item, a[href*='/article/']").slice(0, 10).each((_, element) => {
      const $el = $(element);
      const title = $el.find("h2, h3, .title, a").first().text().trim() || $el.text().trim();
      const url = $el.attr("href") || $el.find("a").first().attr("href") || "";
      const summary = $el.find("p, .summary, .desc").first().text().trim();
      const dateStr = $el.find("time, .date").first().text();
      
      if (title && url) {
        newsItems.push({
          title,
          sourceUrl: url.startsWith("http") ? url : `https://www.aliyun.com${url}`,
          publishedAt: dateStr ? new Date(dateStr) : new Date(),
          summary: summary.substring(0, 500),
          content: summary,
          source: "阿里云AI",
          region: "domestic",
          category: "manufacturer",
        });
      }
    });
    
    for (const news of newsItems) {
      await saveNews(news);
    }
    
    console.log(`[阿里云AI] Crawled ${newsItems.length} news items`);
  } catch (error) {
    console.error("[阿里云AI] Crawler failed:", error);
  }
}

/**
 * 字节跳动AI Crawler
 */
export async function crawlByteDanceAI(): Promise<void> {
  console.log("[字节跳动AI] Starting crawler...");
  
  try {
    const html = await fetchHTML("https://ailab.bytedance.com/");
    if (!html) return;
    
    const $ = cheerio.load(html);
    const newsItems: NewsItem[] = [];
    
    $("article, .news-item, .post, a[href*='/news/'], a[href*='/blog/']").slice(0, 10).each((_, element) => {
      const $el = $(element);
      const title = $el.find("h2, h3, .title").first().text().trim() || $el.text().trim();
      const url = $el.attr("href") || $el.find("a").first().attr("href") || "";
      const summary = $el.find("p, .summary").first().text().trim();
      const dateStr = $el.find("time, .date").first().text();
      
      if (title && url) {
        newsItems.push({
          title,
          sourceUrl: url.startsWith("http") ? url : `https://ailab.bytedance.com${url}`,
          publishedAt: dateStr ? new Date(dateStr) : new Date(),
          summary: summary.substring(0, 500),
          content: summary,
          source: "字节跳动AI",
          region: "domestic",
          category: "manufacturer",
        });
      }
    });
    
    for (const news of newsItems) {
      await saveNews(news);
    }
    
    console.log(`[字节跳动AI] Crawled ${newsItems.length} news items`);
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
  
  // Run domestic crawlers
  // Note: Most Chinese AI company crawlers are temporarily disabled due to:
  // 1. Dynamic content loading requiring browser automation
  // 2. Anti-scraping protections (403/404 errors)
  // 3. Incorrect HTML selectors that don't match actual website structure
  // These will be re-enabled after proper optimization with Puppeteer or API integration
  await Promise.allSettled([
    // crawlZhipuAI(),      // Disabled: requires browser automation
    // crawlMoonshot(),     // Disabled: requires browser automation
    // crawlBaiduAI(),      // Disabled: incorrect selectors
    // crawlAliyunAI(),     // Disabled: incorrect selectors
    // crawlByteDanceAI(),  // Disabled: HTTP 404 error
    // crawlSenseTime(),    // Disabled: incorrect selectors
    // crawlMegvii(),       // Disabled: incorrect selectors
    // crawl4Paradigm(),    // Disabled: incorrect selectors
    // crawlCloudWalk(),    // Disabled: HTTP 403 anti-scraping
    // crawliFlytek(),      // Disabled: incorrect selectors
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
 * SenseTime (商汤科技) News Crawler
 */
export async function crawlSenseTime(): Promise<void> {
  console.log("[商汤科技] Starting crawler...");
  
  try {
    const html = await fetchHTML("https://www.sensetime.com/cn/news-press-release");
    const $ = cheerio.load(html);
    
    const newsItems: NewsItem[] = [];
    
    $("article, .news-item, .press-item").each((_, element) => {
      const $el = $(element);
      const title = $el.find("h2, h3, .title").first().text().trim();
      const url = $el.find("a").first().attr("href") || "";
      const summary = $el.find("p, .summary, .excerpt").first().text().trim();
      const dateStr = $el.find("time, .date").first().text();
      
      if (title && url) {
        newsItems.push({
          title,
          sourceUrl: url.startsWith("http") ? url : `https://www.sensetime.com${url}`,
          publishedAt: dateStr ? new Date(dateStr) : new Date(),
          summary: summary.substring(0, 500),
          content: summary,
          source: "商汤科技",
          region: "domestic",
          category: "manufacturer" as "manufacturer",
        });
      }
    });
    
    for (const news of newsItems.slice(0, 10)) {
      await saveNews(news);
    }
    
    console.log(`[商汤科技] Crawled ${newsItems.length} news items`);
  } catch (error) {
    console.error("[商汤科技] Crawler failed:", error);
  }
}

/**
 * Megvii (旷视科技) News Crawler
 */
export async function crawlMegvii(): Promise<void> {
  console.log("[旷视科技] Starting crawler...");
  
  try {
    const html = await fetchHTML("https://www.megvii.com/news/");
    const $ = cheerio.load(html);
    
    const newsItems: NewsItem[] = [];
    
    $("article, .news-item, .news-card").each((_, element) => {
      const $el = $(element);
      const title = $el.find("h2, h3, .title").first().text().trim();
      const url = $el.find("a").first().attr("href") || "";
      const summary = $el.find("p, .summary, .excerpt").first().text().trim();
      const dateStr = $el.find("time, .date").first().text();
      
      if (title && url) {
        newsItems.push({
          title,
          sourceUrl: url.startsWith("http") ? url : `https://www.megvii.com${url}`,
          publishedAt: dateStr ? new Date(dateStr) : new Date(),
          summary: summary.substring(0, 500),
          content: summary,
          source: "旷视科技",
          region: "domestic",
          category: "manufacturer" as "manufacturer",
        });
      }
    });
    
    for (const news of newsItems.slice(0, 10)) {
      await saveNews(news);
    }
    
    console.log(`[旷视科技] Crawled ${newsItems.length} news items`);
  } catch (error) {
    console.error("[旷视科技] Crawler failed:", error);
  }
}

/**
 * 4Paradigm (第四范式) News Crawler
 */
export async function crawl4Paradigm(): Promise<void> {
  console.log("[第四范式] Starting crawler...");
  
  try {
    const html = await fetchHTML("https://www.4paradigm.com/about/news.html");
    const $ = cheerio.load(html);
    
    const newsItems: NewsItem[] = [];
    
    $("article, .news-item, .news-list-item").each((_, element) => {
      const $el = $(element);
      const title = $el.find("h2, h3, .title, a").first().text().trim();
      const url = $el.find("a").first().attr("href") || "";
      const summary = $el.find("p, .summary, .excerpt").first().text().trim();
      const dateStr = $el.find("time, .date, .time").first().text();
      
      if (title && url) {
        newsItems.push({
          title,
          sourceUrl: url.startsWith("http") ? url : `https://www.4paradigm.com${url}`,
          publishedAt: dateStr ? new Date(dateStr) : new Date(),
          summary: summary.substring(0, 500) || title,
          content: summary || title,
          source: "第四范式",
          region: "domestic",
          category: "manufacturer" as "manufacturer",
        });
      }
    });
    
    for (const news of newsItems.slice(0, 10)) {
      await saveNews(news);
    }
    
    console.log(`[第四范式] Crawled ${newsItems.length} news items`);
  } catch (error) {
    console.error("[第四范式] Crawler failed:", error);
  }
}

/**
 * CloudWalk (云从科技) News Crawler
 */
export async function crawlCloudWalk(): Promise<void> {
  console.log("[云从科技] Starting crawler...");
  
  try {
    const html = await fetchHTML("https://www.cloudwalk.com/");
    const $ = cheerio.load(html);
    
    const newsItems: NewsItem[] = [];
    
    $("article, .news-item, .news-card").each((_, element) => {
      const $el = $(element);
      const title = $el.find("h2, h3, .title").first().text().trim();
      const url = $el.find("a").first().attr("href") || "";
      const summary = $el.find("p, .summary, .excerpt").first().text().trim();
      const dateStr = $el.find("time, .date").first().text();
      
      if (title && url) {
        newsItems.push({
          title,
          sourceUrl: url.startsWith("http") ? url : `https://www.cloudwalk.com${url}`,
          publishedAt: dateStr ? new Date(dateStr) : new Date(),
          summary: summary.substring(0, 500) || title,
          content: summary || title,
          source: "云从科技",
          region: "domestic",
          category: "manufacturer" as "manufacturer",
        });
      }
    });
    
    for (const news of newsItems.slice(0, 10)) {
      await saveNews(news);
    }
    
    console.log(`[云从科技] Crawled ${newsItems.length} news items`);
  } catch (error) {
    console.error("[云从科技] Crawler failed:", error);
  }
}

/**
 * iFlytek (科大讯飞) News Crawler
 */
export async function crawliFlytek(): Promise<void> {
  console.log("[科大讯飞] Starting crawler...");
  
  try {
    const html = await fetchHTML("https://www.iflytek.com/");
    const $ = cheerio.load(html);
    
    const newsItems: NewsItem[] = [];
    
    $("article, .news-item, .news-list-item").each((_, element) => {
      const $el = $(element);
      const title = $el.find("h2, h3, .title").first().text().trim();
      const url = $el.find("a").first().attr("href") || "";
      const summary = $el.find("p, .summary, .excerpt").first().text().trim();
      const dateStr = $el.find("time, .date").first().text();
      
      if (title && url) {
        newsItems.push({
          title,
          sourceUrl: url.startsWith("http") ? url : `https://www.iflytek.com${url}`,
          publishedAt: dateStr ? new Date(dateStr) : new Date(),
          summary: summary.substring(0, 500) || title,
          content: summary || title,
          source: "科大讯飞",
          region: "domestic",
          category: "manufacturer" as "manufacturer",
        });
      }
    });
    
    for (const news of newsItems.slice(0, 10)) {
      await saveNews(news);
    }
    
    console.log(`[科大讯飞] Crawled ${newsItems.length} news items`);
  } catch (error) {
    console.error("[科大讯飞] Crawler failed:", error);
  }
}
