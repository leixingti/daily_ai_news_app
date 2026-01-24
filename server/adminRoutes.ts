/**
 * 管理员专用路由
 * 提供批量翻译等管理功能
 */

import { Router, Request, Response } from "express";
import { getDb } from "./db";
import { aiNews, aiEvents } from "../drizzle/schema";
import { eq, or, like } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { extractArticleContent } from "./contentExtractor";
import translate from 'translate-google';
import { runMigrations } from "./migrate";

const router = Router();

/**
 * 批量翻译文本（优化版）
 */
async function translateBatch(texts: string[], targetLanguage: string = "zh-CN"): Promise<string[]> {
  if (texts.length === 0) return [];
  
  // Google Translate API 不支持批量翻译，使用并发单独翻译
  return Promise.all(texts.map(text => translateText(text, targetLanguage)));
}

/**
 * 翻译文本
 */
async function translateText(text: string, targetLanguage: string = "zh-CN"): Promise<string> {
  try {
    const result = await translate(text, { to: targetLanguage });
    return result; // translate-google 直接返回字符串
  } catch (error) {
    console.error("[AdminAPI] Translation failed:", error);
    return text;
  }
}

/**
 * 检测文本是否为英文
 */
function isEnglish(text: string): boolean {
  const englishChars = text.match(/[a-zA-Z]/g);
  const totalChars = text.replace(/\s/g, "").length;
  
  if (!englishChars || totalChars === 0) return false;
  
  const englishRatio = englishChars.length / totalChars;
  return englishRatio > 0.5;
}

/**
 * GET /api/admin/translate-news
 * 批量翻译国际新闻
 */
router.get("/translate-news", async (req: Request, res: Response) => {
  console.log("[AdminAPI] Batch translation request received");

  // 设置响应头，支持流式输出
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");

  // 发送 HTML 头部
  res.write(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>批量翻译国际新闻</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      max-width: 900px;
      margin: 40px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      border-bottom: 3px solid #4CAF50;
      padding-bottom: 10px;
    }
    .status {
      background: #e3f2fd;
      border-left: 4px solid #2196F3;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .progress {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .success {
      background: #d4edda;
      border-left: 4px solid #28a745;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .error {
      background: #f8d7da;
      border-left: 4px solid #dc3545;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .log {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      padding: 15px;
      margin: 15px 0;
      max-height: 400px;
      overflow-y: auto;
      font-family: "Courier New", monospace;
      font-size: 13px;
      line-height: 1.6;
    }
    .log-entry {
      margin: 5px 0;
      padding: 5px;
    }
    .summary {
      background: #e8f5e9;
      border: 2px solid #4CAF50;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .summary h2 {
      color: #2e7d32;
      margin-top: 0;
    }
    .stat {
      display: inline-block;
      margin: 10px 20px 10px 0;
      font-size: 16px;
    }
    .stat-label {
      color: #666;
      font-weight: normal;
    }
    .stat-value {
      color: #2e7d32;
      font-weight: bold;
      font-size: 20px;
    }
    .spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #4CAF50;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      animation: spin 1s linear infinite;
      display: inline-block;
      margin-right: 10px;
      vertical-align: middle;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🌐 批量翻译国际新闻</h1>
    <div class="status">
      <div class="spinner"></div>
      <strong>正在执行批量翻译...</strong>
    </div>
    <div class="log" id="log">
`);

  try {
    const db = await getDb();
    if (!db) {
      res.write(`<div class="error">❌ 数据库连接失败</div>`);
      res.write(`</div></div></body></html>`);
      res.end();
      return;
    }

    // 查询国际新闻
    res.write(`<div class="log-entry">📊 正在查询国际新闻...</div>`);
    
    const internationalNews = await db
      .select()
      .from(aiNews)
      .where(eq(aiNews.region, "international"))
      .limit(200);

    res.write(`<div class="log-entry">✓ 找到 ${internationalNews.length} 条国际新闻</div>`);
    res.write(`<div class="log-entry">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>`);

    let translatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // 并发处理函数
    const translateNewsItem = async (news: typeof internationalNews[0], index: number) => {
      const progress = `[${index + 1}/${internationalNews.length}]`;
      
      res.write(`<div class="log-entry"><strong>${progress}</strong> 处理新闻 ID: ${news.id}</div>`);
      res.write(`<div class="log-entry">  📰 原标题: ${news.title.substring(0, 60)}${news.title.length > 60 ? '...' : ''}</div>`);

      // 检查是否需要翻译
      const titleNeedsTranslation = isEnglish(news.title);
      const summaryNeedsTranslation = isEnglish(news.summary);

      if (!titleNeedsTranslation && !summaryNeedsTranslation) {
        res.write(`<div class="log-entry">  ✓ 已是中文，保存原文到翻译字段</div>`);
        // 即使不需要翻译，也要保存原文到翻译字段
        await db
          .update(aiNews)
          .set({
            titleZh: news.title,
            summaryZh: news.summary,
            fullContentZh: news.content,
            updatedAt: new Date(),
          })
          .where(eq(aiNews.id, news.id));
        return { status: 'skipped' };
      }

      try {
        res.write(`<div class="log-entry">  🔄 正在翻译...</div>`);

        let translatedTitle = news.title;
        let translatedSummary = news.summary;
        let translatedContent = news.content;

        // 使用批量翻译以提高效率
        const textsToTranslate = [];
        if (titleNeedsTranslation) {
          textsToTranslate.push(news.title);
        }
        if (summaryNeedsTranslation) {
          textsToTranslate.push(news.summary);
        }

        if (textsToTranslate.length > 0) {
          const translatedTexts = await translateBatch(textsToTranslate);
          let idx = 0;
          if (titleNeedsTranslation) {
            translatedTitle = translatedTexts[idx++];
          }
          if (summaryNeedsTranslation) {
            translatedSummary = translatedTexts[idx++];
          }
        }

        res.write(`<div class="log-entry">  📝 译标题: ${translatedTitle.substring(0, 60)}${translatedTitle.length > 60 ? '...' : ''}</div>`);

        // 抓取并翻译完整文章内容
        try {
          res.write(`<div class="log-entry">  🔍 正在抓取完整内容...</div>`);
          const articleContent = await extractArticleContent(news.sourceUrl);
          
          if (articleContent && articleContent.length > 200) {
            res.write(`<div class="log-entry">  🌐 正在翻译全文 (${articleContent.length} 字符)...</div>`);
            translatedContent = await translateText(articleContent);
            res.write(`<div class="log-entry">  ✓ 全文翻译完成</div>`);
          } else {
            res.write(`<div class="log-entry">  ⚠️ 内容提取失败，使用摘要</div>`);
            translatedContent = translatedSummary;
          }
        } catch (error) {
          res.write(`<div class="log-entry">  ⚠️ 全文翻译失败: ${error}</div>`);
          translatedContent = translatedSummary;
        }

        // 更新数据库 - 保存到翻译字段，保留原始内容
        await db
          .update(aiNews)
          .set({
            titleZh: translatedTitle,
            summaryZh: translatedSummary,
            fullContentZh: translatedContent,
            updatedAt: new Date(),
          })
          .where(eq(aiNews.id, news.id));

        res.write(`<div class="log-entry">  ✓ 翻译完成并保存</div>`);
        return { status: 'success' };
      } catch (error) {
        res.write(`<div class="log-entry error">  ✗ 翻译失败: ${error}</div>`);
        return { status: 'error' };
      }
    };

    // 并发处理，每批次 5 条
    const BATCH_SIZE = 5;
    for (let i = 0; i < internationalNews.length; i += BATCH_SIZE) {
      const batch = internationalNews.slice(i, i + BATCH_SIZE);
      res.write(`<div class="log-entry"><strong>🚀 并发处理第 ${Math.floor(i / BATCH_SIZE) + 1} 批次 (${batch.length} 条新闻)</strong></div>`);
      
      const results = await Promise.all(
        batch.map((news, batchIndex) => translateNewsItem(news, i + batchIndex))
      );

      // 统计结果
      results.forEach(result => {
        if (result.status === 'success') translatedCount++;
        else if (result.status === 'skipped') skippedCount++;
        else if (result.status === 'error') errorCount++;
      });

      res.write(`<div class="log-entry">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>`);
      
      // 批次间延迟，避免 API 限流
      if (i + BATCH_SIZE < internationalNews.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // 输出统计信息
    res.write(`</div>`); // 关闭 log div
    res.write(`
      <div class="summary">
        <h2>📊 翻译完成统计</h2>
        <div class="stat">
          <span class="stat-label">总计：</span>
          <span class="stat-value">${internationalNews.length}</span> 条
        </div>
        <div class="stat">
          <span class="stat-label">已翻译：</span>
          <span class="stat-value">${translatedCount}</span> 条
        </div>
        <div class="stat">
          <span class="stat-label">已跳过：</span>
          <span class="stat-value">${skippedCount}</span> 条
        </div>
        <div class="stat">
          <span class="stat-label">失败：</span>
          <span class="stat-value">${errorCount}</span> 条
        </div>
      </div>
      <div class="success">
        <strong>✅ 批量翻译执行完成！</strong>
        <p>请访问网站首页，筛选"国际新闻"查看翻译效果。</p>
        <p><a href="https://daily-ai-news-app.onrender.com" target="_blank">打开网站 →</a></p>
      </div>
    `);

    console.log(`[AdminAPI] Batch translation completed: ${translatedCount} translated, ${skippedCount} skipped, ${errorCount} failed`);

  } catch (error) {
    console.error("[AdminAPI] Batch translation error:", error);
    res.write(`
      <div class="error">
        <strong>❌ 批量翻译过程中出错</strong>
        <p>${error}</p>
      </div>
    `);
  }

  // 发送 HTML 尾部
  res.write(`
  </div>
</body>
</html>
  `);
  res.end();
});

/**
 * POST /api/admin/run-migration
 * 手动触发数据库迁移
 */
router.post("/run-migration", async (req: Request, res: Response) => {
  try {
    console.log("[AdminAPI] Manual migration triggered");
    await runMigrations();
    res.json({ success: true, message: "Migration completed successfully" });
  } catch (error) {
    console.error("[AdminAPI] Migration failed:", error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

/**
 * GET /api/admin/insert-events
 * 直接插入会议数据（绕过爬虫）
 */
router.get("/insert-events", async (req: Request, res: Response) => {
  try {
    console.log("[AdminAPI] Direct event insertion triggered...");
    
    const db = await getDb();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: "Database connection failed",
        error: "DATABASE_URL not set or database not available",
      });
    }
    
    const { aiEvents } = await import("../drizzle/schema");
    
    const eventsData = [
      {
        name: "NeurIPS 2026",
        nameZh: "神经信息处理系统大会 2026",
        description: "The premier conference for machine learning and computational neuroscience research.",
        descriptionZh: "机器学习和计算神经科学研究的顶级会议。",
        startDate: new Date("2026-12-07"),
        endDate: new Date("2026-12-12"),
        location: "Vancouver, Canada",
        locationZh: "加拿大温哥华",
        website: "https://neurips.cc/",
        submissionDeadline: new Date("2026-05-15"),
        tags: ["Machine Learning", "AI Research", "Neural Networks"],
        status: "upcoming" as const,
      },
      {
        name: "ICML 2026",
        nameZh: "国际机器学习大会 2026",
        description: "International Conference on Machine Learning, a leading forum for ML research.",
        descriptionZh: "国际机器学习大会，机器学习研究的领先论坛。",
        startDate: new Date("2026-07-12"),
        endDate: new Date("2026-07-18"),
        location: "Vienna, Austria",
        locationZh: "奥地利维也纳",
        website: "https://icml.cc/",
        submissionDeadline: new Date("2026-01-28"),
        tags: ["Machine Learning", "AI Research", "Deep Learning"],
        status: "upcoming" as const,
      },
      {
        name: "CVPR 2026",
        nameZh: "计算机视觉与模式识别大会 2026",
        description: "Computer Vision and Pattern Recognition, the top conference in computer vision.",
        descriptionZh: "计算机视觉与模式识别大会，计算机视觉领域的顶级会议。",
        startDate: new Date("2026-06-14"),
        endDate: new Date("2026-06-19"),
        location: "Seattle, USA",
        locationZh: "美国西雅图",
        website: "https://cvpr2026.thecvf.com/",
        submissionDeadline: new Date("2025-11-15"),
        tags: ["Computer Vision", "Pattern Recognition", "AI"],
        status: "upcoming" as const,
      },
      {
        name: "AAAI 2026",
        nameZh: "人工智能促进协会大会 2026",
        description: "Association for the Advancement of Artificial Intelligence Conference.",
        descriptionZh: "人工智能促进协会大会。",
        startDate: new Date("2026-02-23"),
        endDate: new Date("2026-02-28"),
        location: "Philadelphia, USA",
        locationZh: "美国费城",
        website: "https://aaai.org/conference/aaai/aaai-26/",
        submissionDeadline: new Date("2025-08-15"),
        tags: ["AI Research", "Machine Learning", "Robotics"],
        status: "upcoming" as const,
      },
      {
        name: "ACL 2026",
        nameZh: "计算语言学协会年会 2026",
        description: "Annual Meeting of the Association for Computational Linguistics.",
        descriptionZh: "计算语言学协会年会。",
        startDate: new Date("2026-07-26"),
        endDate: new Date("2026-07-31"),
        location: "Bangkok, Thailand",
        locationZh: "泰国曼谷",
        website: "https://2026.aclweb.org/",
        submissionDeadline: new Date("2026-02-15"),
        tags: ["NLP", "Computational Linguistics", "AI"],
        status: "upcoming" as const,
      },
      {
        name: "ICLR 2026",
        nameZh: "国际学习表征大会 2026",
        description: "International Conference on Learning Representations.",
        descriptionZh: "国际学习表征大会。",
        startDate: new Date("2026-04-27"),
        endDate: new Date("2026-05-01"),
        location: "Kigali, Rwanda",
        locationZh: "卢旺达基加利",
        website: "https://iclr.cc/",
        submissionDeadline: new Date("2025-10-01"),
        tags: ["Deep Learning", "Representation Learning", "AI"],
        status: "upcoming" as const,
      },
      {
        name: "IJCAI 2026",
        nameZh: "国际人工智能联合会议 2026",
        description: "International Joint Conference on Artificial Intelligence.",
        descriptionZh: "国际人工智能联合会议。",
        startDate: new Date("2026-08-21"),
        endDate: new Date("2026-08-27"),
        location: "Montreal, Canada",
        locationZh: "加拿大蒙特利尔",
        website: "https://ijcai-26.org/",
        submissionDeadline: new Date("2026-01-21"),
        tags: ["AI Research", "Multi-Agent Systems", "Knowledge Representation"],
        status: "upcoming" as const,
      },
      {
        name: "ECCV 2026",
        nameZh: "欧洲计算机视觉大会 2026",
        description: "European Conference on Computer Vision.",
        descriptionZh: "欧洲计算机视觉大会。",
        startDate: new Date("2026-10-11"),
        endDate: new Date("2026-10-16"),
        location: "Milan, Italy",
        locationZh: "意大利米兰",
        website: "https://eccv2026.eu/",
        submissionDeadline: new Date("2026-03-07"),
        tags: ["Computer Vision", "Image Processing", "AI"],
        status: "upcoming" as const,
      },
      {
        name: "KDD 2026",
        nameZh: "知识发现与数据挖掘大会 2026",
        description: "ACM SIGKDD Conference on Knowledge Discovery and Data Mining.",
        descriptionZh: "ACM SIGKDD 知识发现与数据挖掘大会。",
        startDate: new Date("2026-08-15"),
        endDate: new Date("2026-08-19"),
        location: "Barcelona, Spain",
        locationZh: "西班牙巴塞罗那",
        website: "https://kdd.org/kdd2026/",
        submissionDeadline: new Date("2026-02-08"),
        tags: ["Data Mining", "Knowledge Discovery", "AI Applications"],
        status: "upcoming" as const,
      },
      {
        name: "ICCV 2027",
        nameZh: "国际计算机视觉大会 2027",
        description: "International Conference on Computer Vision (biennial).",
        descriptionZh: "国际计算机视觉大会（两年一次）。",
        startDate: new Date("2027-10-17"),
        endDate: new Date("2027-10-24"),
        location: "Paris, France",
        locationZh: "法国巴黎",
        website: "https://iccv2027.thecvf.com/",
        submissionDeadline: new Date("2027-03-15"),
        tags: ["Computer Vision", "3D Vision", "AI"],
        status: "upcoming" as const,
      },
      {
        name: "SIGIR 2026",
        nameZh: "信息检索研究与发展国际会议 2026",
        description: "International ACM SIGIR Conference on Research and Development in Information Retrieval.",
        descriptionZh: "ACM SIGIR 信息检索研究与发展国际会议。",
        startDate: new Date("2026-07-19"),
        endDate: new Date("2026-07-23"),
        location: "Washington D.C., USA",
        locationZh: "美国华盛顿特区",
        website: "https://sigir.org/sigir2026/",
        submissionDeadline: new Date("2026-01-22"),
        tags: ["Information Retrieval", "Search", "NLP"],
        status: "upcoming" as const,
      },
    ];
    
    let insertedCount = 0;
    for (const event of eventsData) {
      try {
        await db.insert(aiEvents).values(event);
        insertedCount++;
      } catch (error) {
        console.error(`[AdminAPI] Failed to insert ${event.name}:`, error);
      }
    }
    
    const allEvents = await db.select().from(aiEvents);
    
    res.json({
      success: true,
      message: "Events inserted successfully",
      insertedCount,
      totalEvents: allEvents.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[AdminAPI] Failed to insert events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to insert events",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/admin/trigger-events-crawler
 * 手动触发会议爬虫
 */
router.get("/trigger-events-crawler", async (req: Request, res: Response) => {
  try {
    console.log("[AdminAPI] Triggering events crawler...");
    
    // 检查数据库连接
    const db = await getDb();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: "Database connection failed",
        error: "DATABASE_URL not set or database not available",
        timestamp: new Date().toISOString(),
      });
    }
    
    // 运行爬虫 (已切换到真实会议爬虫)
    const { runRealEventsCrawler } = await import("./realEventsCrawler");
    await runRealEventsCrawler();
    
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
    console.error("[AdminAPI] Failed to trigger crawler:", error);
    res.status(500).json({
      success: false,
      message: "Failed to trigger events crawler",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/admin/status
 * 健康检查
 */
router.get("/status", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    message: "Admin API is running"
  });
});

/**
 * GET /api/admin/cleanup-fake-events
 * 清理数据库中的假会议数据（包含 example.com 的记录）
 */
router.get("/cleanup-fake-events", async (req: Request, res: Response) => {
  try {
    console.log("[AdminAPI] Cleanup fake events triggered");
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ success: false, message: "Database connection failed" });
    }

    const result = await db
      .delete(aiEvents)
      .where(
        or(
          like(aiEvents.registrationUrl, "%example.com%"),
          like(aiEvents.url, "%example.com%")
        )
      );

    console.log("[AdminAPI] Cleanup fake events completed");
    res.json({ 
      success: true, 
      message: "Fake events cleaned up successfully",
      result 
    });
  } catch (error) {
    console.error("[AdminAPI] Cleanup failed:", error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

export default router;
