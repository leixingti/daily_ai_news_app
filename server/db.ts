import { eq, asc, desc, like, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, aiNews, favorites, searchHistory, readHistory, aiEvents, rssSources, systemConfig } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql.Pool | null = null;
let _connecting = false;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (_db) {
    return _db;
  }
  
  const dbUrl = process.env.DATABASE_URL;
  console.log("[DB] getDb() called");
  console.log("[DB] DATABASE_URL exists:", !!dbUrl);
  
  if (!dbUrl) {
    console.error("[DB] DATABASE_URL environment variable not set");
    return null;
  }

  // Prevent multiple concurrent connection attempts
  if (_connecting) {
    console.log("[DB] Connection in progress, waiting...");
    let attempts = 0;
    while (!_db && _connecting && attempts < 100) {
      await new Promise(resolve => setTimeout(resolve, 50));
      attempts++;
    }
    return _db;
  }

  _connecting = true;
  try {
    console.log("[DB] Creating MySQL pool...");
    
    _pool = mysql.createPool({
      uri: dbUrl,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });

    // Test connection
    console.log("[DB] Testing connection...");
    const connection = await _pool.getConnection();
    const result = await connection.query('SELECT NOW()');
    connection.release();
    console.log("[DB] Connection test successful");
    
    // Create drizzle instance
    _db = drizzle(_pool);
    console.log("[DB] Drizzle instance created successfully");
    
  } catch (error) {
    console.error("[DB] Failed to connect:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error) {
      console.error("[DB] Stack:", error.stack);
    }
    _db = null;
    _pool = null;
  } finally {
    _connecting = false;
  }
  
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[DB] Cannot upsert user: database not available");
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

    const existing = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
    if (existing.length > 0) {
      await db.update(users).set(updateSet).where(eq(users.openId, user.openId));
    } else {
      await db.insert(users).values(values);
    }
  } catch (error) {
    console.error("[DB] Failed to upsert user:", error);
    throw error;
  }
}

export async function getAiNewsList(input: {
  limit?: number;
  offset?: number;
  category?: string;
  region?: string;
  searchQuery?: string;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[DB] Cannot get news list: database not available");
    return [];
  }

  try {
    let query = db.select().from(aiNews);

    const conditions = [];
    if (input.category && input.category !== "全部") {
      conditions.push(eq(aiNews.category, input.category as any));
    }
    if (input.region && input.region !== "全部") {
      conditions.push(eq(aiNews.region, input.region as any));
    }
    if (input.searchQuery) {
      conditions.push(
        or(
          like(aiNews.title, `%${input.searchQuery}%`),
          like(aiNews.content, `%${input.searchQuery}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query
      .orderBy(desc(aiNews.publishedAt))
      .limit(input.limit || 30)
      .offset(input.offset || 0);

    return result;
  } catch (error) {
    console.error("[DB] Failed to get news list:", error);
    return [];
  }
}

export async function getAiNewsById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[DB] Cannot get news: database not available");
    return null;
  }

  try {
    const result = await db.select().from(aiNews).where(eq(aiNews.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[DB] Failed to get news:", error);
    return null;
  }
}

export async function getNewsByCategory() {
  const db = await getDb();
  if (!db) {
    console.warn("[DB] Cannot get news by category: database not available");
    return [];
  }

  try {
    const result = await db
      .select({
        category: aiNews.category,
        count: sql`count(*)`.as("count"),
      })
      .from(aiNews)
      .groupBy(aiNews.category);

    return result;
  } catch (error) {
    console.error("[DB] Failed to get news by category:", error);
    return [];
  }
}

export async function getNewsByRegion() {
  const db = await getDb();
  if (!db) {
    console.warn("[DB] Cannot get news by region: database not available");
    return [];
  }

  try {
    const result = await db
      .select({
        region: aiNews.region,
        count: sql`count(*)`.as("count"),
      })
      .from(aiNews)
      .groupBy(aiNews.region);

    return result;
  } catch (error) {
    console.error("[DB] Failed to get news by region:", error);
    return [];
  }
}

export async function getEventsList(input: {
  limit?: number;
  offset?: number;
  region?: string;
  searchQuery?: string;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[DB] Cannot get events list: database not available");
    return [];
  }

  try {
    let query = db.select().from(aiEvents);

    const conditions = [];
    if (input.region && input.region !== "全部") {
      conditions.push(eq(aiEvents.region, input.region as any));
    }
    if (input.searchQuery) {
      conditions.push(
        or(
          like(aiEvents.name, `%${input.searchQuery}%`),
          like(aiEvents.description, `%${input.searchQuery}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query
      .orderBy(asc(aiEvents.startDate))
      .limit(input.limit || 30)
      .offset(input.offset || 0);

    return result;
  } catch (error) {
    console.error("[DB] Failed to get events list:", error);
    return [];
  }
}

export async function getAiEventById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[DB] Cannot get event: database not available");
    return null;
  }

  try {
    const result = await db.select().from(aiEvents).where(eq(aiEvents.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[DB] Failed to get event:", error);
    return null;
  }
}

// Helper function for OR conditions
function or(...conditions: any[]) {
  return sql`(${sql.join(conditions, sql` OR `)})`
}

// RSS Sources Management
export async function getAllRssSources() {
  const db = await getDb();
  if (!db) {
    console.warn("[DB] Cannot get RSS sources: database not available");
    return [];
  }

  try {
    const result = await db.select().from(rssSources).orderBy(asc(rssSources.createdAt));
    return result;
  } catch (error) {
    console.error("[DB] Failed to get RSS sources:", error);
    return [];
  }
}

export async function insertRssSource(source: {
  name: string;
  url: string;
  description?: string;
  region: string;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[DB] Cannot insert RSS source: database not available");
    return false;
  }

  try {
    await db.insert(rssSources).values({
      name: source.name,
      url: source.url,
      description: source.description,
      region: (source.region || "international") as any,
      isActive: 1,
    });
    return true;
  } catch (error) {
    console.error("[DB] Failed to insert RSS source:", error);
    return false;
  }
}

export async function updateRssSource(id: number, updates: Partial<{
  name: string;
  description: string;
  isActive: number;
}>) {
  const db = await getDb();
  if (!db) {
    console.warn("[DB] Cannot update RSS source: database not available");
    return false;
  }

  try {
    await db.update(rssSources).set({
      ...updates,
      updatedAt: new Date(),
    }).where(eq(rssSources.id, id));
    return true;
  } catch (error) {
    console.error("[DB] Failed to update RSS source:", error);
    return false;
  }
}

export async function deleteRssSource(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[DB] Cannot delete RSS source: database not available");
    return false;
  }

  try {
    await db.delete(rssSources).where(eq(rssSources.id, id));
    return true;
  } catch (error) {
    console.error("[DB] Failed to delete RSS source:", error);
    return false;
  }
}

// Search and Read History
export async function getTrendingSearches() {
  const db = await getDb();
  if (!db) {
    console.warn("[DB] Cannot get trending searches: database not available");
    return [];
  }

  try {
    const result = await db
      .select({
        query: searchHistory.query,
        count: sql`count(*)`.as("count"),
      })
      .from(searchHistory)
      .groupBy(searchHistory.query)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    return result;
  } catch (error) {
    console.error("[DB] Failed to get trending searches:", error);
    return [];
  }
}

export async function markAsRead(userId: number, newsId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[DB] Cannot mark as read: database not available");
    return false;
  }

  try {
    await db.insert(readHistory).values({
      userId,
      newsId,
    });
    return true;
  } catch (error) {
    console.error("[DB] Failed to mark as read:", error);
    return false;
  }
}

export async function getReadNews(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[DB] Cannot get read news: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(readHistory)
      .where(eq(readHistory.userId, userId))
      .orderBy(desc(readHistory.readAt));

    return result;
  } catch (error) {
    console.error("[DB] Failed to get read news:", error);
    return [];
  }
}

// Events alias for compatibility
export async function getAiEventsList(input: {
  limit?: number;
  offset?: number;
  region?: string;
  searchQuery?: string;
}) {
  return getEventsList(input);
}

// Favorites Management
export async function isFavorited(userId: number, newsId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[DB] Cannot check favorite: database not available");
    return false;
  }

  try {
    const result = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.newsId, newsId)))
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error("[DB] Failed to check favorite:", error);
    return false;
  }
}

export async function addSearchHistory(userId: number, query: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[DB] Cannot add search history: database not available");
    return false;
  }

  try {
    await db.insert(searchHistory).values({
      userId,
      query,
      resultCount: 0,
    });
    return true;
  } catch (error) {
    console.error("[DB] Failed to add search history:", error);
    return false;
  }
}

export async function getSearchHistory(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[DB] Cannot get search history: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(searchHistory)
      .where(eq(searchHistory.userId, userId))
      .orderBy(desc(searchHistory.searchedAt))
      .limit(20);

    return result;
  } catch (error) {
    console.error("[DB] Failed to get search history:", error);
    return [];
  }
}

// Favorites CRUD
export async function addFavorite(userId: number, newsId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[DB] Cannot add favorite: database not available");
    return false;
  }

  try {
    await db.insert(favorites).values({
      userId,
      newsId,
    });
    return true;
  } catch (error) {
    console.error("[DB] Failed to add favorite:", error);
    return false;
  }
}

export async function removeFavorite(userId: number, newsId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[DB] Cannot remove favorite: database not available");
    return false;
  }

  try {
    await db.delete(favorites).where(
      and(eq(favorites.userId, userId), eq(favorites.newsId, newsId))
    );
    return true;
  } catch (error) {
    console.error("[DB] Failed to remove favorite:", error);
    return false;
  }
}

export async function getFavorites(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[DB] Cannot get favorites: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));

    return result;
  } catch (error) {
    console.error("[DB] Failed to get favorites:", error);
    return [];
  }
}

// User queries
export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[DB] Cannot get user: database not available");
    return null;
  }

  try {
    const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[DB] Failed to get user:", error);
    return null;
  }
}
