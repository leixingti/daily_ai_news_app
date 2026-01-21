import axios from "axios";
import { getDb } from "./db";
import { aiEvents } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface EventData {
  name: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
  type: "online" | "offline";
  region: "domestic" | "international";
  registrationUrl?: string;
  speakers?: string;
  agenda?: string;
  expectedAttendees?: number;
  url: string; // sourceUrl renamed to url
}

/**
 * 会议类型关键词
 */
const EVENT_TYPE_KEYWORDS = {
  online: ["线上", "在线", "webinar", "virtual", "online", "直播", "远程"],
  offline: ["线下", "现场", "会场", "地点", "venue", "地址"],
  forum: ["论坛", "峰会", "大会", "conference", "summit", "congress"],
};

/**
 * 识别会议类型
 */
export function identifyEventType(
  text: string
): "online" | "offline" {
  const lowerText = text.toLowerCase();

  const hasOnline = EVENT_TYPE_KEYWORDS.online.some((keyword) =>
    lowerText.includes(keyword)
  );
  const hasOffline = EVENT_TYPE_KEYWORDS.offline.some((keyword) =>
    lowerText.includes(keyword)
  );

  if (hasOnline) return "online";
  if (hasOffline) return "offline";

  // 默认为线下
  return "offline";
}

/**
 * 从 IT 之家爬取会议信息（示例）
 */
async function crawlFromITHome(): Promise<EventData[]> {
  try {
    const response = await axios.get(
      "https://www.ithome.com/search?keywords=AI%E4%BC%9A%E8%AE%AE&type=news",
      {
        timeout: 10000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );

    // 这是一个示例实现，实际需要根据网站结构进行解析
    const events: EventData[] = [];
    // 解析逻辑...

    return events;
  } catch (error) {
    console.error("[EventsCrawler] Failed to crawl from IT Home:", error);
    return [];
  }
}

/**
 * 从 36Kr 爬取会议信息（示例）
 */
async function crawlFrom36Kr(): Promise<EventData[]> {
  try {
    const response = await axios.get(
      "https://36kr.com/search?q=AI%E4%BC%9A%E8%AE%AE",
      {
        timeout: 10000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );

    const events: EventData[] = [];
    // 解析逻辑...

    return events;
  } catch (error) {
    console.error("[EventsCrawler] Failed to crawl from 36Kr:", error);
    return [];
  }
}

/**
 * 从 AI 行业论坛爬取会议信息（示例）
 */
async function crawlFromAIForums(): Promise<EventData[]> {
  const events: EventData[] = [];

  // 示例数据：国内常见的 AI 会议
    const sampleEvents = [
    {
      name: "2026 年中国 AI 产业大会",
      description: "探讨 AI 在各行业的应用和发展趋势",
      startDate: new Date("2026-03-15"),
      endDate: new Date("2026-03-17"),
      location: "北京国家会议中心",
      type: "offline" as const,
      region: "domestic" as const,
      registrationUrl: "https://example.com/register",
      speakers: "李开复、杨植麟、张钹等行业专家",
      agenda: "主题演讲、分论坛、技术展示、投融资对接",
      expectedAttendees: 5000,
      url: "https://example.com/event/1",
    },
    {
      name: "CCAI 2026 全球人工智能大会",
      description: "全球顶级 AI 学术和产业盛会",
      startDate: new Date("2026-08-20"),
      endDate: new Date("2026-08-22"),
      location: "上海世博展览馆",
      type: "offline" as const,
      region: "domestic" as const,
      registrationUrl: "https://example.com/ccai2026",
      speakers: "国内外顶级 AI 专家",
      agenda: "学术报告、工业论坛、竞赛展示",
      expectedAttendees: 8000,
      url: "https://example.com/ccai2026",
    },
    {
      name: "大模型时代的 AI 创新论坛",
      description: "探讨大模型技术在实际应用中的机遇和挑战",
      startDate: new Date("2026-02-28"),
      location: "线上",
      type: "online" as const,
      region: "domestic" as const,
      registrationUrl: "https://example.com/llm-forum",
      speakers: "业界领袖、技术专家",
      agenda: "主题分享、圆桌讨论、Q&A 互动",
      expectedAttendees: 10000,
      url: "https://example.com/llm-forum",
    },
  ];

  return sampleEvents;
}

/**
 * 检查事件是否已存在
 */
async function eventExists(
  name: string,
  startDate: Date
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const existing = await db
    .select()
    .from(aiEvents)
    .where(eq(aiEvents.name, name))
    .limit(1);

  return existing.length > 0;
}

/**
 * 保存或更新事件
 */
async function saveOrUpdateEvent(event: EventData): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[EventsCrawler] Database not available");
    return;
  }

  try {
    // 检查是否已存在
    const existing = await db
      .select()
      .from(aiEvents)
      .where(eq(aiEvents.name, event.name))
      .limit(1);

    if (existing.length > 0) {
      // 更新现有事件
      await db
        .update(aiEvents)
        .set({
          description: event.description,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          type: event.type,
          registrationUrl: event.registrationUrl,
          speakers: event.speakers,
          agenda: event.agenda,
          expectedAttendees: event.expectedAttendees,
          updatedAt: new Date(),
        })
        .where(eq(aiEvents.name, event.name));

      console.log(`[EventsCrawler] Updated event: ${event.name}`);
    } else {
      // 插入新事件
      await db.insert(aiEvents).values({
        name: event.name,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        type: event.type,
        region: event.region,
        registrationUrl: event.registrationUrl,
        speakers: event.speakers,
        agenda: event.agenda,
        expectedAttendees: event.expectedAttendees,
        url: event.url,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`[EventsCrawler] Created event: ${event.name}`);
    }
  } catch (error) {
    console.error("[EventsCrawler] Failed to save event:", error);
  }
}

/**
 * 执行完整的爬虫任务
 */
export async function runEventsCrawler(): Promise<void> {
  console.log("[EventsCrawler] Starting events crawler...");

  try {
    // 从多个数据源爬取事件
    const [eventsFromITHome, eventsFrom36Kr, eventsFromForums] = await Promise.all([
      crawlFromITHome(),
      crawlFrom36Kr(),
      crawlFromAIForums(),
    ]);

    const allEvents = [
      ...eventsFromITHome,
      ...eventsFrom36Kr,
      ...eventsFromForums,
    ];

    console.log(`[EventsCrawler] Crawled ${allEvents.length} events`);

    // 处理每个事件
    for (const event of allEvents) {
      // 识别事件类型
      const eventType = identifyEventType(
        `${event.name} ${event.description} ${event.location || ""}`
      );
      event.type = eventType;

      // 保存或更新事件
      await saveOrUpdateEvent(event);
    }

    console.log("[EventsCrawler] Events crawler completed successfully");
  } catch (error) {
    console.error("[EventsCrawler] Crawler failed:", error);
  }
}

/**
 * 启动定时爬虫任务（每 6 小时执行一次）
 */
export function startEventsCrawlerSchedule(): void {
  // 立即执行一次
  runEventsCrawler();

  // 每 6 小时执行一次 (6 * 60 * 60 * 1000 = 21600000 ms)
  const INTERVAL_MS = 6 * 60 * 60 * 1000;

  setInterval(() => {
    runEventsCrawler();
  }, INTERVAL_MS);

  console.log("[EventsCrawler] Events crawler schedule started (every 6 hours)");
}
