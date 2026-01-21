import { eq, asc, desc, like, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users, aiNews, favorites, searchHistory, readHistory, aiEvents, rssSources, systemConfig } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // PostgreSQL upsert using onConflictDoUpdate
    const query = db.insert(users).values(values);
    // For PostgreSQL, we need to use raw SQL or handle the conflict differently
    // Since this is a user upsert, we'll first try to update, then insert if not found
    const existing = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
    if (existing.length > 0) {
      await db.update(users).set(updateSet).where(eq(users.openId, user.openId));
    } else {
      await query;
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ==================== AI News Queries ====================

export async function getAiNewsList(params: {
  limit?: number;
  offset?: number;
  category?: string;
  region?: string;
  searchQuery?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  const { limit = 30, offset = 0, category, region, searchQuery } = params;
  
  const conditions: any[] = [];

  if (category) {
    conditions.push(eq(aiNews.category, category as any));
  }
  if (region) {
    conditions.push(eq(aiNews.region, region as any));
  }
  if (searchQuery) {
    conditions.push(
      sql`(${aiNews.title} LIKE ${`%${searchQuery}%`} OR ${aiNews.summary} LIKE ${`%${searchQuery}%`})`
    );
  }

  let query: any = db.select().from(aiNews);
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const result = await query
    .orderBy(desc(aiNews.publishedAt))
    .limit(limit)
    .offset(offset);

  return result;
}

export async function getAiNewsById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(aiNews).where(eq(aiNews.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ==================== Favorites Queries ====================

export async function addFavorite(userId: number, newsId: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.insert(favorites).values({ userId, newsId });
    return true;
  } catch (error) {
    console.error("[Database] Failed to add favorite:", error);
    return false;
  }
}

export async function removeFavorite(userId: number, newsId: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.delete(favorites).where(
      and(eq(favorites.userId, userId), eq(favorites.newsId, newsId))
    );
    return true;
  } catch (error) {
    console.error("[Database] Failed to remove favorite:", error);
    return false;
  }
}

export async function getFavorites(userId: number, limit = 30, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  const favoriteIds = await db
    .select({ newsId: favorites.newsId })
    .from(favorites)
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt))
    .limit(limit)
    .offset(offset);

  if (favoriteIds.length === 0) return [];

  const newsIds = favoriteIds.map(f => f.newsId);
  const result = await db.select().from(aiNews).where(
    sql`${aiNews.id} IN (${sql.join(newsIds)})`
  );

  return result;
}

export async function isFavorited(userId: number, newsId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db.select().from(favorites).where(
    and(eq(favorites.userId, userId), eq(favorites.newsId, newsId))
  ).limit(1);

  return result.length > 0;
}

// ==================== Search History Queries ====================

export async function addSearchHistory(userId: number, query: string, resultCount: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.insert(searchHistory).values({ userId, query, resultCount });
    return true;
  } catch (error) {
    console.error("[Database] Failed to add search history:", error);
    return false;
  }
}

export async function getSearchHistory(userId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(searchHistory)
    .where(eq(searchHistory.userId, userId))
    .orderBy(desc(searchHistory.searchedAt))
    .limit(limit);

  return result;
}

export async function getTrendingSearches(limit = 10) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({
    query: searchHistory.query,
    count: sql<number>`COUNT(*) as count`
  })
    .from(searchHistory)
    .groupBy(searchHistory.query)
    .orderBy(sql`count DESC`)
    .limit(limit);

  return result;
}

// ==================== Read History Queries ====================

export async function markAsRead(userId: number, newsId: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    // Check if already read
    const existing = await db.select().from(readHistory).where(
      and(eq(readHistory.userId, userId), eq(readHistory.newsId, newsId))
    ).limit(1);

    if (existing.length === 0) {
      await db.insert(readHistory).values({ userId, newsId });
    }
    return true;
  } catch (error) {
    console.error("[Database] Failed to mark as read:", error);
    return false;
  }
}

export async function getReadNews(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({ newsId: readHistory.newsId }).from(readHistory)
    .where(eq(readHistory.userId, userId));

  return result.map(r => r.newsId);
}

// ==================== Events Queries ====================

export async function getAiEventsList(params: {
  limit?: number;
  offset?: number;
  type?: string;
  region?: string;
  timeStatus?: string;
  searchQuery?: string;
  sortBy?: 'date' | 'location';
  sortOrder?: 'asc' | 'desc';
  location?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  const { limit = 30, offset = 0, type, region, timeStatus, searchQuery, sortBy = 'date', sortOrder = 'desc', location } = params;
  
  const conditions: any[] = [];

  if (type) {
    conditions.push(eq(aiEvents.type, type as any));
  }
  if (region) {
    conditions.push(eq(aiEvents.region, region as any));
  }
  if (location) {
    conditions.push(sql`${aiEvents.location} LIKE ${`%${location}%`}`);
  }
  if (timeStatus === 'upcoming') {
    conditions.push(sql`${aiEvents.startDate} > NOW()`);
  } else if (timeStatus === 'past') {
    conditions.push(sql`${aiEvents.startDate} <= NOW()`);
  }
  if (searchQuery) {
    conditions.push(
      sql`(${aiEvents.name} LIKE ${`%${searchQuery}%`} OR ${aiEvents.description} LIKE ${`%${searchQuery}%`})`
    );
  }

  let query: any = db.select().from(aiEvents);
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  // Apply sorting
  if (sortBy === 'location') {
    query = query.orderBy(sortOrder === 'asc' ? asc(aiEvents.location) : desc(aiEvents.location));
  } else {
    query = query.orderBy(sortOrder === 'asc' ? asc(aiEvents.startDate) : desc(aiEvents.startDate));
  }

  const result = await query
    .limit(limit)
    .offset(offset);

  return result;
}

export async function getAiEventById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(aiEvents).where(eq(aiEvents.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ==================== Statistics Queries ====================

export async function getNewsByCategory() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({
    category: aiNews.category,
    count: sql<number>`COUNT(*) as count`
  })
    .from(aiNews)
    .groupBy(aiNews.category);

  return result;
}

export async function getNewsByRegion() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({
    region: aiNews.region,
    count: sql<number>`COUNT(*) as count`
  })
    .from(aiNews)
    .groupBy(aiNews.region);

  return result;
}

// ==================== RSS Sources Queries ====================

export async function getAllRssSources() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(rssSources).orderBy(rssSources.id);
  return result;
}

export async function getActiveRssSources() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(rssSources).where(eq(rssSources.isActive, 1));
  return result;
}

export async function insertRssSource(data: any) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.insert(rssSources).values(data);
    return true;
  } catch (error) {
    console.error("[Database] Failed to insert RSS source:", error);
    return false;
  }
}

export async function updateRssSource(id: number, data: any) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(rssSources).set(data).where(eq(rssSources.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update RSS source:", error);
    return false;
  }
}

export async function deleteRssSource(id: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.delete(rssSources).where(eq(rssSources.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete RSS source:", error);
    return false;
  }
}

// ==================== System Config Queries ====================

export async function getSystemConfig(key: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(systemConfig).where(eq(systemConfig.key, key)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function setSystemConfig(key: string, value: string) {
  const db = await getDb();
  if (!db) return false;

  try {
    const existing = await getSystemConfig(key);
    if (existing) {
      await db.update(systemConfig).set({ value }).where(eq(systemConfig.key, key));
    } else {
      await db.insert(systemConfig).values({ key, value });
    }
    return true;
  } catch (error) {
    console.error("[Database] Failed to set system config:", error);
    return false;
  }
}
