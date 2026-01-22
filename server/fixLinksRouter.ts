/**
 * 修复数据库中包含 CDATA 标签的链接
 */
import { Router } from "express";
import { getDb } from "./db";
import { aiNews } from "../drizzle/schema";
import { sql } from "drizzle-orm";

const router = Router();

router.post("/fix-links", async (req, res) => {
  try {
    const db = await getDb();
    
    if (!db) {
      return res.status(500).json({
        success: false,
        error: "Database not available",
      });
    }
    
    // 查询所有包含 CDATA 标签的新闻
    const newsWithCDATA = await db
      .select()
      .from(aiNews)
      .where(sql`${aiNews.sourceUrl} LIKE '%CDATA%'`);
    
    console.log(`[FixLinks] Found ${newsWithCDATA.length} news with CDATA tags`);
    
    let fixedCount = 0;
    
    for (const news of newsWithCDATA) {
      // 去除 CDATA 标签
      const fixedUrl = news.sourceUrl.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
      
      if (fixedUrl !== news.sourceUrl) {
        await db
          .update(aiNews)
          .set({ sourceUrl: fixedUrl })
          .where(sql`${aiNews.id} = ${news.id}`);
        
        fixedCount++;
        console.log(`[FixLinks] Fixed: ${news.id} - ${news.sourceUrl} -> ${fixedUrl}`);
      }
    }
    
    res.json({
      success: true,
      message: `Fixed ${fixedCount} news links`,
      total: newsWithCDATA.length,
      fixed: fixedCount,
    });
  } catch (error) {
    console.error("[FixLinks] Error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
