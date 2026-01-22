/**
 * RSS 新闻爬虫系统
 * 从 20 个 RSS 源（国内 10 个，国外 10 个）抓取 AI 相关新闻
 * 国外新闻自动翻译，每 5 分钟自动更新
 */

import axios from "axios";
import { getDb } from "./db";
import { aiNews } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { extractArticleContent } from "./contentExtractor";

interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: Date;
  source: string;
  region: "domestic" | "international";
  category?: string;
  fullContent?: string;
}

/**
 * 国内 RSS 源配置（10 个）
 */
const DOMESTIC_RSS_SOURCES = [
  {
    name: "机器之心",
    url: "https://www.jiqizhixin.com/feed",
    region: "domestic" as const,
  },
  {
    name: "新智元",
    url: "https://www.aizhingyuan.com/feed",
    region: "domestic" as const,
  },
  {
    name: "量子位",
    url: "https://www.qbitai.com/feed",
    region: "domestic" as const,
  },
  {
    name: "专知",
    url: "https://www.zhuanzhi.ai/feed",
    region: "domestic" as const,
  },
  {
    name: "AI 科技评论",
    url: "https://www.aitechtalk.com/feed",
    region: "domestic" as const,
  },
  {
    name: "36Kr",
    url: "https://36kr.com/feed",
    region: "domestic" as const,
  },
  {
    name: "IT 之家",
    url: "https://www.ithome.com/feed",
    region: "domestic" as const,
  },
  {
    name: "极客公园",
    url: "https://www.geekpark.net/feed",
    region: "domestic" as const,
  },
  {
    name: "爱范儿",
    url: "https://www.ifanr.com/feed",
    region: "domestic" as const,
  },
  {
    name: "钛媒体",
    url: "https://www.tmtpost.com/feed",
    region: "domestic" as const,
  },
];

/**
 * 国外 RSS 源配置（10 个）
 */
const INTERNATIONAL_RSS_SOURCES = [
  {
    name: "Hacker News",
    url: "https://news.ycombinator.com/rss",
    region: "international" as const,
  },
  {
    name: "TechCrunch",
    url: "https://techcrunch.com/feed/",
    region: "international" as const,
  },
  {
    name: "The Verge",
    url: "https://www.theverge.com/rss/index.xml",
    region: "international" as const,
  },
  {
    name: "MIT Technology Review",
    url: "https://www.technologyreview.com/feed.rss",
    region: "international" as const,
  },
  {
    name: "ArXiv AI",
    url: "https://arxiv.org/rss/cs.AI",
    region: "international" as const,
  },
  {
    name: "OpenAI Blog",
    url: "https://openai.com/blog/rss.xml",
    region: "international" as const,
  },
  {
    name: "DeepMind Blog",
    url: "https://deepmind.google/blog/feed/",
    region: "international" as const,
  },
  {
    name: "Towards Data Science",
    url: "https://towardsdatascience.com/feed",
    region: "international" as const,
  },
  {
    name: "Analytics Vidhya",
    url: "https://www.analyticsvidhya.com/feed/",
    region: "international" as const,
  },
  {
    name: "Medium AI",
    url: "https://medium.com/feed/tag/artificial-intelligence",
    region: "international" as const,
  },
];

const ALL_RSS_SOURCES = [...DOMESTIC_RSS_SOURCES, ...INTERNATIONAL_RSS_SOURCES];

/**
 * 批量翻译文本（优化版）
 * 将多个文本合并成一次 API 调用，提升效率
 */
async function translateBatch(texts: string[], targetLanguage: string = "zh"): Promise<string[]> {
  if (texts.length === 0) return [];
  if (texts.length === 1) return [await translateText(texts[0], targetLanguage)];

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following JSON array of texts to ${targetLanguage}. Return a JSON array with the same length, containing only the translated texts. Keep translations concise and accurate.`,
        },
        {
          role: "user",
          content: JSON.stringify(texts),
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content;
    if (typeof content === "string") {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length === texts.length) {
          return parsed;
        }
      } catch (e) {
        console.error("[RSSNewsCrawler] Failed to parse batch translation result:", e);
      }
    }
    
    // 如果批量翻译失败，回退到逐条翻译
    console.warn("[RSSNewsCrawler] Batch translation failed, falling back to individual translation");
    return Promise.all(texts.map(text => translateText(text, targetLanguage)));
  } catch (error) {
    console.error("[RSSNewsCrawler] Batch translation failed:", error);
    // 失败时回退到逐条翻译
    return Promise.all(texts.map(text => translateText(text, targetLanguage)));
  }
}

/**
 * 翻译文本（国外新闻翻译为中文）
 */
async function translateText(text: string, targetLanguage: string = "zh"): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text to ${targetLanguage}. Keep the translation concise and accurate. Only return the translated text without any explanation.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content;
    const translatedText = typeof content === "string" ? content : text;
    return translatedText;
  } catch (error) {
    console.error("[RSSNewsCrawler] Translation failed:", error);
    return text; // 翻译失败时返回原文
  }
}

/**
 * 解析 RSS 源
 */
async function parseRSSFeed(
  sourceUrl: string,
  sourceName: string,
  region: "domestic" | "international"
): Promise<RSSItem[]> {
  try {
    console.log(`[RSSNewsCrawler] Fetching RSS from ${sourceName}...`);

    const response = await axios.get(sourceUrl, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const items: RSSItem[] = [];
    const xmlContent = response.data;

    // 简单的 RSS 解析（提取 item 标签）
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    let count = 0;

    while ((match = itemRegex.exec(xmlContent)) && count < 10) {
      const itemContent = match[1];

      // 提取标题
      const titleMatch = /<title>([\s\S]*?)<\/title>/.exec(itemContent);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, "").trim() : "";

      // 提取描述
      const descriptionMatch = /<description>([\s\S]*?)<\/description>/.exec(
        itemContent
      );
      let description = descriptionMatch
        ? descriptionMatch[1].replace(/<[^>]*>/g, "").trim()
        : "";

      // 提取链接
      const linkMatch = /<link>([\s\S]*?)<\/link>/.exec(itemContent);
      const link = linkMatch ? linkMatch[1].trim() : "";

      // 提取发布日期
      const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(itemContent);
      const pubDate = pubDateMatch ? new Date(pubDateMatch[1]) : new Date();

      // 检查是否为 AI 相关新闻
      const aiKeywords = [
        "AI",
        "人工智能",
        "机器学习",
        "深度学习",
        "神经网络",
        "LLM",
        "大模型",
        "GPT",
        "BERT",
        "Transformer",
        "NLP",
        "计算机视觉",
        "强化学习",
        "生成模型",
        "算法",
        "数据科学",
        "machine learning",
        "deep learning",
        "neural network",
        "language model",
        "computer vision",
      ];

      const isAIRelated = aiKeywords.some(
        (keyword) =>
          title.toLowerCase().includes(keyword.toLowerCase()) ||
          description.toLowerCase().includes(keyword.toLowerCase())
      );

      if (isAIRelated && title && link) {
        // 国外新闻翻译（同时翻译标题和描述）
        let translatedTitle = title;
        let translatedDescription = description;
        
        if (region === "international") {
          try {
            // 使用批量翻译以提高效率（一次 API 调用翻译标题和描述）
            const [titleResult, descResult] = await translateBatch([title, description]);
            translatedTitle = titleResult;
            translatedDescription = descResult;
            console.log(`[RSSNewsCrawler] Translated: "${title.substring(0, 50)}..." -> "${translatedTitle.substring(0, 50)}..."`);
          } catch (error) {
            console.error(`[RSSNewsCrawler] Translation failed for item, using original text:`, error);
          }
        }

        // 抓取并翻译完整文章内容（仅国际新闻）
        let fullContent = translatedDescription;
        if (region === "international" && link) {
          try {
            console.log(`[RSSNewsCrawler] Extracting full content from: ${link}`);
            const articleContent = await extractArticleContent(link);
            
            if (articleContent && articleContent.length > 200) {
              // 翻译完整内容
              console.log(`[RSSNewsCrawler] Translating full content (${articleContent.length} chars)...`);
              fullContent = await translateText(articleContent);
              console.log(`[RSSNewsCrawler] Full content translated successfully`);
            } else {
              console.log(`[RSSNewsCrawler] Content extraction failed or too short, using description`);
            }
          } catch (error) {
            console.error(`[RSSNewsCrawler] Failed to extract/translate full content:`, error);
          }
        }

        items.push({
          title: translatedTitle,
          description: translatedDescription,
          link,
          pubDate,
          source: sourceName,
          region,
          fullContent: fullContent,
        });

        count++;
      }
    }

    console.log(
      `[RSSNewsCrawler] Fetched ${items.length} AI-related items from ${sourceName}`
    );
    return items;
  } catch (error) {
    console.error(
      `[RSSNewsCrawler] Failed to fetch from ${sourceName}:`,
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

/**
 * 保存新闻到数据库
 */
async function saveNews(item: RSSItem): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[RSSNewsCrawler] Database not available");
    return false;
  }

  try {
    // 检查新闻是否已存在（基于链接）
    const existing = await db
      .select()
      .from(aiNews)
      .where(eq(aiNews.sourceUrl, item.link))
      .limit(1);

    if (existing.length > 0) {
      // 新闻已存在，跳过
      return false;
    }

    // 插入新闻
    await db.insert(aiNews).values({
      title: item.title,
      summary: item.description.substring(0, 200),
      content: item.fullContent || item.description,
      sourceUrl: item.link,
      region: item.region,
      category: (item.category || "tech") as "tech" | "product" | "industry" | "event",
      publishedAt: item.pubDate,
      contentHash: Buffer.from(item.link).toString("hex").substring(0, 64),
      translationStatus: item.region === "international" ? 1 : 0,
    });

    return true;
  } catch (error) {
    console.error("[RSSNewsCrawler] Failed to save news:", error);
    return false;
  }
}

/**
 * 运行 RSS 爬虫
 */
export async function runRSSNewsCrawler(): Promise<void> {
  try {
    console.log("[RSSNewsCrawler] Starting RSS news crawler...");

    let totalFetched = 0;
    let totalSaved = 0;

    // 并行抓取所有 RSS 源
    const crawlPromises = ALL_RSS_SOURCES.map(async (source) => {
      const items = await parseRSSFeed(source.url, source.name, source.region);
      let saved = 0;

      for (const item of items) {
        const success = await saveNews(item);
        if (success) {
          saved++;
        }
      }

      totalFetched += items.length;
      totalSaved += saved;

      return { source: source.name, fetched: items.length, saved };
    });

    const results = await Promise.all(crawlPromises);

    console.log("[RSSNewsCrawler] RSS news crawler completed");
    console.log(`[RSSNewsCrawler] Total fetched: ${totalFetched}, Total saved: ${totalSaved}`);

    results.forEach((result) => {
      console.log(
        `[RSSNewsCrawler] ${result.source}: ${result.fetched} fetched, ${result.saved} saved`
      );
    });
  } catch (error) {
    console.error("[RSSNewsCrawler] Crawler failed:", error);
  }
}

/**
 * 初始化 RSS 爬虫调度
 */
export function initializeRSSNewsCrawlerSchedule(): void {
  // 立即运行一次
  runRSSNewsCrawler();

  // 每 10 分钟运行一次
  setInterval(() => {
    runRSSNewsCrawler();
  }, 10 * 60 * 1000); // 10 分钟

  console.log("[RSSNewsCrawler] Scheduled to run every 10 minutes");
}
