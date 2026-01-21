import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eventsCrawlerRouter } from "./eventsCrawlerRouter";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ==================== News Management ====================
  news: router({
    list: publicProcedure
      .input(
        z.object({
          limit: z.number().optional().default(30),
          offset: z.number().optional().default(0),
          category: z.string().optional(),
          region: z.string().optional(),
          searchQuery: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        const { getAiNewsList } = await import("./db");
        return await getAiNewsList(input);
      }),

    detail: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getAiNewsById } = await import("./db");
        return await getAiNewsById(input.id);
      }),

    stats: publicProcedure.query(async () => {
      const { getNewsByCategory, getNewsByRegion } = await import("./db");
      const byCategory = await getNewsByCategory();
      const byRegion = await getNewsByRegion();
      return { byCategory, byRegion };
    }),
  }),

  // ==================== Favorites Management ====================
  favorites: router({
    add: protectedProcedure
      .input(z.object({ newsId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { addFavorite } = await import("./db");
        const success = await addFavorite(ctx.user.id, input.newsId);
        if (!success) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to add favorite" });
        }
        return { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({ newsId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { removeFavorite } = await import("./db");
        const success = await removeFavorite(ctx.user.id, input.newsId);
        if (!success) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to remove favorite" });
        }
        return { success: true };
      }),

    list: protectedProcedure
      .input(
        z.object({
          limit: z.number().optional().default(30),
          offset: z.number().optional().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        const { getFavorites } = await import("./db");
        return await getFavorites(ctx.user.id, input.limit, input.offset);
      }),

    check: protectedProcedure
      .input(z.object({ newsId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { isFavorited } = await import("./db");
        const isFav = await isFavorited(ctx.user.id, input.newsId);
        return { isFavorited: isFav };
      }),
  }),

  // ==================== Search Management ====================
  search: router({
    query: publicProcedure
      .input(
        z.object({
          q: z.string(),
          limit: z.number().optional().default(30),
          offset: z.number().optional().default(0),
        })
      )
      .query(async ({ input, ctx }) => {
        const { getAiNewsList, addSearchHistory } = await import("./db");
        const results = await getAiNewsList({
          searchQuery: input.q,
          limit: input.limit,
          offset: input.offset,
        });

        // Record search history if user is logged in
        if (ctx.user) {
          await addSearchHistory(ctx.user.id, input.q, results.length);
        }

        return results;
      }),

    history: protectedProcedure
      .input(z.object({ limit: z.number().optional().default(10) }))
      .query(async ({ ctx, input }) => {
        const { getSearchHistory } = await import("./db");
        return await getSearchHistory(ctx.user.id, input.limit);
      }),

    trending: publicProcedure
      .input(z.object({ limit: z.number().optional().default(10) }))
      .query(async ({ input }) => {
        const { getTrendingSearches } = await import("./db");
        return await getTrendingSearches(input.limit);
      }),
  }),

  // ==================== Read History Management ====================
  readHistory: router({
    markAsRead: protectedProcedure
      .input(z.object({ newsId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { markAsRead } = await import("./db");
        const success = await markAsRead(ctx.user.id, input.newsId);
        if (!success) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to mark as read" });
        }
        return { success: true };
      }),

    getReadNews: protectedProcedure.query(async ({ ctx }) => {
      const { getReadNews } = await import("./db");
      return await getReadNews(ctx.user.id);
    }),
  }),

  // ==================== Events Management ====================
  events: router({
    list: publicProcedure
      .input(
        z.object({
          limit: z.number().optional().default(30),
          offset: z.number().optional().default(0),
          type: z.string().optional(),
          region: z.string().optional(),
          timeStatus: z.string().optional(),
          searchQuery: z.string().optional(),
          sortBy: z.enum(['date', 'location']).optional().default('date'),
          sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
          location: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        const { getAiEventsList } = await import("./db");
        return await getAiEventsList(input);
      }),

    detail: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getAiEventById } = await import("./db");
        return await getAiEventById(input.id);
      }),
  }),

  // ==================== RSS Sources Management ====================
  rssSources: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
      }
      const { getAllRssSources } = await import("./db");
      return await getAllRssSources();
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          url: z.string().url(),
          description: z.string().optional(),
          region: z.string().optional().default("international"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
        }
        const { insertRssSource } = await import("./db");
        const success = await insertRssSource(input);
        if (!success) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create RSS source" });
        }
        return { success: true };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          url: z.string().url().optional(),
          description: z.string().optional(),
          region: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
        }
        const { id, ...updates } = input;
        const { updateRssSource } = await import("./db");
        const success = await updateRssSource(id, updates);
        if (!success) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update RSS source" });
        }
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
        }
        const { deleteRssSource } = await import("./db");
        const success = await deleteRssSource(input.id);
        if (!success) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete RSS source" });
        }
        return { success: true };
      }),
  }),

  // ==================== Events Crawler Management ====================
  crawler: eventsCrawlerRouter,
});

export type AppRouter = typeof appRouter;
