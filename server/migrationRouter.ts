/**
 * 数据库迁移触发路由
 * 提供 HTTP 端点手动触发数据库迁移
 */

import { Router } from "express";
import { runMigrations } from "./migrate";

const router = Router();

router.post("/run-migration", async (req, res) => {
  try {
    console.log("[MigrationRouter] Manual migration triggered");
    await runMigrations();
    res.json({ success: true, message: "Migration completed successfully" });
  } catch (error) {
    console.error("[MigrationRouter] Migration failed:", error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

export default router;
