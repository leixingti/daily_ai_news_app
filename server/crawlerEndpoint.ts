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
 * GET 端点：方便浏览器直接访问
 */
crawlerEndpoint.get("/api/trigger-events-crawler", async (req, res) => {
  try {
    console.log("[CrawlerEndpoint] Triggering events crawler via GET...");
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
