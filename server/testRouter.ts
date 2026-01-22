import { Router } from "express";
import { getDb } from "./db";
import { aiNews } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const testRouter = Router();

// 测试端点：返回一条国际新闻的完整数据
testRouter.get("/test-translation", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // 查询第一条国际新闻
    const news = await db
      .select()
      .from(aiNews)
      .where(eq(aiNews.region, "international"))
      .limit(1);

    if (news.length === 0) {
      return res.status(404).json({ error: "No international news found" });
    }

    // 返回完整数据
    res.json({
      id: news[0].id,
      title: news[0].title,
      titleZh: news[0].titleZh,
      summary: news[0].summary,
      summaryZh: news[0].summaryZh,
      content: news[0].content,
      fullContentZh: news[0].fullContentZh,
      region: news[0].region,
      source: news[0].source,
    });
  } catch (error) {
    console.error("[Test] Error:", error);
    res.status(500).json({ error: String(error) });
  }
});
