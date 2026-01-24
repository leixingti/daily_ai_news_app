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
  category: "tech" | "product" | "industry" | "manufacturer";
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
  const db = getDb();
  
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
          category: "AI Tools",
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
          category: "AI大模型",
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
          category: "AI大模型",
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
          category: "AI大模型",
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
          category: "AI大模型",
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
          category: "AI大模型",
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
  ]);
  
  // Run domestic crawlers
  await Promise.allSettled([
    crawlZhipuAI(),
    crawlMoonshot(),
    crawlBaiduAI(),
    crawlAliyunAI(),
    crawlByteDanceAI(),
  ]);
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[AI Companies] All crawlers completed in ${duration}s`);
}
