import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Enum definitions
 */
const categoryEnum = mysqlEnum("category", ["tech", "product", "industry", "event"]);
const regionEnum = mysqlEnum("region", ["domestic", "international"]);
const eventTypeEnum = mysqlEnum("event_type", ["online", "offline"]);

/**
 * AI 新闻表
 */

export const aiNews = mysqlTable("ai_news", {
  id: int("id").autoincrement().primaryKey(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  sourceUrl: varchar("sourceUrl", { length: 512 }).notNull(),
  category: categoryEnum.default("tech").notNull(),
  region: regionEnum.default("international").notNull(),
  publishedAt: timestamp("publishedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  contentHash: varchar("contentHash", { length: 64 }).notNull(),
  relatedNewsId: int("relatedNewsId"),
  isDuplicate: int("isDuplicate").default(0).notNull(),
  similarityScore: int("similarityScore").default(0).notNull(),
  translationStatus: int("translationStatus").default(1).notNull(),
  translationRetries: int("translationRetries").default(0).notNull(),
});

export type AiNews = typeof aiNews.$inferSelect;
export type InsertAiNews = typeof aiNews.$inferInsert;

/**
 * AI 业界会议表
 */
export const aiEvents = mysqlTable("ai_events", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  url: varchar("url", { length: 512 }).notNull().unique(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  location: text("location"),
  type: eventTypeEnum.notNull(),
  region: regionEnum.default("international").notNull(),
  registrationUrl: text("registrationUrl"),
  speakers: text("speakers"),
  expectedAttendees: int("expectedAttendees"),
  agenda: text("agenda"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AiEvent = typeof aiEvents.$inferSelect;
export type InsertAiEvent = typeof aiEvents.$inferInsert;

/**
 * 用户收藏表 - 存储用户收藏的新闻
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  newsId: int("newsId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

/**
 * 搜索历史表 - 记录用户搜索行为
 */
export const searchHistory = mysqlTable("search_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  query: text("query").notNull(),
  resultCount: int("resultCount").default(0).notNull(),
  searchedAt: timestamp("searchedAt").defaultNow().notNull(),
});

export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = typeof searchHistory.$inferInsert;

/**
 * 用户阅读历史表
 */
export const readHistory = mysqlTable("read_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  newsId: int("newsId").notNull(),
  readAt: timestamp("readAt").defaultNow().notNull(),
});

export type ReadHistory = typeof readHistory.$inferSelect;
export type InsertReadHistory = typeof readHistory.$inferInsert;

/**
 * RSS 源表
 */
export const rssSources = mysqlTable("rss_sources", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  url: varchar("url", { length: 512 }).notNull().unique(),
  description: text("description"),
  isActive: int("is_active").default(1).notNull(),
  region: regionEnum.default("international").notNull(),
  lastFetchedAt: timestamp("last_fetched_at"),
  successCount: int("success_count").default(0).notNull(),
  failureCount: int("failure_count").default(0).notNull(),
  totalNewsCount: int("total_news_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type RssSource = typeof rssSources.$inferSelect;
export type InsertRssSource = typeof rssSources.$inferInsert;

/**
 * 系统配置表
 */
export const systemConfig = mysqlTable("system_config", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = typeof systemConfig.$inferInsert;