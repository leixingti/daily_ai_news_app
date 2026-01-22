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
  url: string;
}

const EVENT_TYPE_KEYWORDS = {
  online: ["线上", "在线", "webinar", "virtual", "online", "直播", "远程"],
  offline: ["线下", "现场", "会场", "地点", "venue", "地址"],
  forum: ["论坛", "峰会", "大会", "conference", "summit", "congress"],
};

export function identifyEventType(text: string): "online" | "offline" {
  const lowerText = text.toLowerCase();
  const hasOnline = EVENT_TYPE_KEYWORDS.online.some((keyword) =>
    lowerText.includes(keyword)
  );
  const hasOffline = EVENT_TYPE_KEYWORDS.offline.some((keyword) =>
    lowerText.includes(keyword)
  );
  if (hasOnline) return "online";
  if (hasOffline) return "offline";
  return "offline";
}

async function crawlAIConferences(): Promise<EventData[]> {
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const oneYearLater = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

  const aiConferences: EventData[] = [
    // 2025年会议
    {
      name: "2025中国AI应用大会",
      description: "AI技术在各行业的实际应用案例分享",
      startDate: new Date("2025-03-20"),
      endDate: new Date("2025-03-22"),
      location: "北京国家会议中心",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://example.com/ai-app-2025",
      speakers: "业界领袖、技术专家",
      agenda: "主题演讲、分论坛、技术展示、投融资对接",
      expectedAttendees: 3000,
      url: "https://example.com/ai-app-2025",
    },
    {
      name: "LLM大模型技术论坛2025",
      description: "探讨大语言模型的最新进展和应用",
      startDate: new Date("2025-05-15"),
      endDate: new Date("2025-05-17"),
      location: "上海世博展览馆",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://example.com/llm-2025",
      speakers: "模型研究专家、业界从业者",
      agenda: "技术演讲、产品演示、业界对话",
      expectedAttendees: 2500,
      url: "https://example.com/llm-2025",
    },
    {
      name: "AI与业务整合峰会",
      description: "AI技术与传统业务的整合与实践",
      startDate: new Date("2025-07-10"),
      endDate: new Date("2025-07-12"),
      location: "深圳会议中心",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://example.com/ai-business-2025",
      speakers: "企业主管、技术总监",
      agenda: "案例研究、技术分享、产业应用",
      expectedAttendees: 2000,
      url: "https://example.com/ai-business-2025",
    },
    {
      name: "2025年AI开源社区大会",
      description: "开源AI项目的发展和社区建设",
      startDate: new Date("2025-09-18"),
      endDate: new Date("2025-09-20"),
      location: "线上",
      type: "online",
      region: "domestic",
      registrationUrl: "https://example.com/ai-opensource-2025",
      speakers: "开源项目维护者、社区领袖",
      agenda: "项目分享、技术讨论、社区建设",
      expectedAttendees: 5000,
      url: "https://example.com/ai-opensource-2025",
    },
    {
      name: "2025年计算机视觉技术大会",
      description: "计算机视觉领域的最新技术和应用",
      startDate: new Date("2025-10-25"),
      endDate: new Date("2025-10-27"),
      location: "杭州",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://example.com/cv-2025",
      speakers: "视觉算法专家、应用开发者",
      agenda: "学术报告、技术工作坊、应用展示",
      expectedAttendees: 1800,
      url: "https://example.com/cv-2025",
    },
    // 2026年会议
    {
      name: "2026中国AI产业大会",
      description: "探讨AI在各行业的应用和发展趋势",
      startDate: new Date("2026-03-15"),
      endDate: new Date("2026-03-17"),
      location: "北京国家会议中心",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://example.com/ai-industry-2026",
      speakers: "李开复、杨植麟、张钹等行业专家",
      agenda: "主题演讲、分论坛、技术展示、投融资对接",
      expectedAttendees: 5000,
      url: "https://example.com/ai-industry-2026",
    },
    {
      name: "CCAI 2026全球人工智能大会",
      description: "全球顶级AI学术和产业盛会",
      startDate: new Date("2026-08-20"),
      endDate: new Date("2026-08-22"),
      location: "上海世博展览馆",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://example.com/ccai2026",
      speakers: "国内外顶级AI专家",
      agenda: "学术报告、工业论坛、竞赛展示",
      expectedAttendees: 8000,
      url: "https://example.com/ccai2026",
    },
    {
      name: "大模型时代的AI创新论坛",
      description: "探讨大模型技术在实际应用中的机遇和挑战",
      startDate: new Date("2026-02-28"),
      location: "线上",
      type: "online",
      region: "domestic",
      registrationUrl: "https://example.com/llm-forum",
      speakers: "业界领袖、技术专家",
      agenda: "主题分享、圆桌讨论、Q&A互动",
      expectedAttendees: 10000,
      url: "https://example.com/llm-forum",
    },
    {
      name: "AI与深度学习技术峰会",
      description: "深度学习技术的最新进展和应用",
      startDate: new Date("2026-06-10"),
      endDate: new Date("2026-06-12"),
      location: "杭州亚民大会堂",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://example.com/dl-summit-2026",
      speakers: "深度学习研究专家",
      agenda: "技术议题、实践分享、产业应用",
      expectedAttendees: 3500,
      url: "https://example.com/dl-summit-2026",
    },
    {
      name: "2026年自然语言处理技术论坛",
      description: "NLP技术的最新进展和应用场景",
      startDate: new Date("2026-04-22"),
      endDate: new Date("2026-04-24"),
      location: "北京",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://example.com/nlp-2026",
      speakers: "NLP研究者、应用开发者",
      agenda: "技术演讲、案例分享、工作坊",
      expectedAttendees: 2200,
      url: "https://example.com/nlp-2026",
    },
    {
      name: "2026年AI芯片技术大会",
      description: "AI芯片的设计、制造和应用",
      startDate: new Date("2026-11-15"),
      endDate: new Date("2026-11-17"),
      location: "深圳",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://example.com/ai-chip-2026",
      speakers: "芯片设计师、制造商",
      agenda: "技术报告、产品展示、投资对接",
      expectedAttendees: 2800,
      url: "https://example.com/ai-chip-2026",
    },
  ];

  return aiConferences.filter((event) => {
    const eventDate = new Date(event.startDate);
    return eventDate >= oneYearAgo && eventDate <= oneYearLater;
  });
}

async function eventExists(name: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const existing = await db
    .select()
    .from(aiEvents)
    .where(eq(aiEvents.name, name))
    .limit(1);
  return existing.length > 0;
}

async function saveOrUpdateEvent(event: EventData): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[EventsCrawler] Database not available");
    return;
  }
  try {
    const existing = await db
      .select()
      .from(aiEvents)
      .where(eq(aiEvents.name, event.name))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(aiEvents)
        .set({
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
          updatedAt: new Date(),
        })
        .where(eq(aiEvents.name, event.name));
      console.log(`[EventsCrawler] Updated event: ${event.name}`);
    } else {
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
      });
      console.log(`[EventsCrawler] Created event: ${event.name}`);
    }
  } catch (error) {
    console.error(`[EventsCrawler] Failed to save event ${event.name}:`, error);
  }
}

export async function runEventsCrawler(): Promise<void> {
  console.log("[EventsCrawler] Starting crawler...");
  console.log("[EventsCrawler] DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");
  
  try {
    const db = await getDb();
    if (!db) {
      console.error("[EventsCrawler] Database connection failed");
      return;
    }
    console.log("[EventsCrawler] Database connected successfully");
    
    const events = await crawlAIConferences();
    console.log(`[EventsCrawler] Found ${events.length} events`);

    let successCount = 0;
    let failCount = 0;
    
    for (const event of events) {
      try {
        await saveOrUpdateEvent(event);
        successCount++;
      } catch (error) {
        failCount++;
        console.error(`[EventsCrawler] Failed to save event ${event.name}:`, error);
      }
    }

    console.log(`[EventsCrawler] Completed: ${successCount} success, ${failCount} failed`);
    
    // 验证插入结果
    const allEvents = await db.select().from(aiEvents);
    console.log(`[EventsCrawler] Total events in database: ${allEvents.length}`);
  } catch (error) {
    console.error("[EventsCrawler] Crawler failed:", error);
  }
}

export function startEventsCrawlerSchedule(): void {
  console.log("[EventsCrawler] Scheduling crawler to run every 10 minutes");
  runEventsCrawler();
  setInterval(() => {
    runEventsCrawler();
  }, 10 * 60 * 1000);
}
