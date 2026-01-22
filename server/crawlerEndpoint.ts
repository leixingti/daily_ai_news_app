import { Router } from "express";
import { runEventsCrawler } from "./eventsCrawler";

export const crawlerEndpoint = Router();

/**
 * 公开端点：触发会议爬虫
 */
crawlerEndpoint.post("/api/trigger-events-crawler", async (req, res) => {
  try {
    console.log("[CrawlerEndpoint] Triggering events crawler...");
    await runEventsCrawler();
    res.json({
      success: true,
      message: "Events crawler triggered successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CrawlerEndpoint] Failed to trigger crawler:", error);
    res.status(500).json({
      success: false,
      message: "Failed to trigger events crawler",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET 端点：方便浏览器直接访问，返回详细执行结果
 */
crawlerEndpoint.get("/api/trigger-events-crawler", async (req, res) => {
  try {
    console.log("[CrawlerEndpoint] Triggering events crawler via GET...");
    
    // 检查数据库连接
    const { getDb } = await import("./db");
    const db = await getDb();
    
    if (!db) {
      return res.status(500).json({
        success: false,
        message: "Database connection failed",
        error: "DATABASE_URL not set or database not available",
        timestamp: new Date().toISOString(),
      });
    }
    
    // 运行爬虫
    await runEventsCrawler();
    
    // 查询数据库中的会议数量
    const { aiEvents } = await import("../drizzle/schema");
    const events = await db.select().from(aiEvents);
    
    res.json({
      success: true,
      message: "Events crawler triggered successfully",
      eventsCount: events.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CrawlerEndpoint] Failed to trigger crawler:", error);
    res.status(500).json({
      success: false,
      message: "Failed to trigger events crawler",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
  }
});
