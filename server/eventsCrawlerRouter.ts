import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { runEventsCrawler, startEventsCrawlerSchedule } from "./eventsCrawler";
import { TRPCError } from "@trpc/server";

/**
 * 会议爬虫路由
 */
export const eventsCrawlerRouter = router({
  /**
   * 手动触发爬虫任务（仅管理员）
   */
  triggerCrawl: protectedProcedure
    .mutation(async ({ ctx }) => {
      // 检查是否为管理员
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can trigger crawler",
        });
      }

      try {
        await runEventsCrawler();
        return {
          success: true,
          message: "Crawler triggered successfully",
        };
      } catch (error) {
        console.error("Failed to trigger crawler:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to trigger crawler",
        });
      }
    }),

  /**
   * 获取爬虫状态（仅管理员）
   */
  getStatus: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view crawler status",
        });
      }

      return {
        status: "running",
        lastRun: new Date(),
        nextRun: new Date(Date.now() + 10 * 60 * 1000),
        interval: "10 minutes",
      };
    }),
});
