import { eq, asc, desc, like, and, or, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { InsertUser, users, aiNews, favorites, searchHistory, readHistory, aiEvents, rssSources, systemConfig } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _connecting = false;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (_db) return _db;
  
  if (!process.env.DATABASE_URL) {
    console.warn("[Database] DATABASE_URL not set");
    return null;
  }

  // Prevent multiple concurrent connection attempts
  if (_connecting) {
    // Wait for connection to complete
    let attempts = 0;
    while (!_db && _connecting && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    return _db;
  }

  _connecting = true;
  try {
    console.log("[Database] Attempting to connect...");
    // PostgreSQL connection with SSL support for Railway
    const connectionString = process.env.DATABASE_URL;
    
    const client = new pg.Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
    });
    
    // Force rebuild - Railway SSL fix
    console.log("[Database] Configured with SSL rejectUnauthorized: false");
    
    // Test the connection
    const testResult = await client.query('SELECT 1');
    console.log("[Database] Connection test successful");
    
    _db = drizzle(client);
    console.log("[Database] Connected successfully");
  } catch (error) {
    console.error("[Database] Failed to connect:", error);
    _db = null;
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

export async function getAiNewsList(input: {
  limit?: number;
  offset?: number;
  category?: string;
  region?: string;
  searchQuery?: string;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get news list: database not available");
    return [];
  }

  try {
    let query = db.select().from(aiNews);

    const conditions = [];
    
    // 添加源过滤：只显示 8 个精选源的新闻
    const allowedSources = [
      '机器之心',
      '量子位',
      '36Kr',
      'MIT Technology Review',
      'ArXiv AI',
      'OpenAI Blog',
      'DeepMind Blog',
      'TechCrunch'
    ];
    conditions.push(inArray(aiNews.source, allowedSources));
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
      query = query.where(and(...conditions)) as any;
    }

    const result = await query
      .orderBy(desc(aiNews.publishedAt))
      .limit(input.limit || 30)
      .offset(input.offset || 0);

    return result;
  } catch (error) {
    console.error("[Database] Failed to get news list:", error);
    return [];
  }
}

export async function getAiNewsById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get news: database not available");
    return null;
  }

  try {
    const result = await db.select().from(aiNews).where(eq(aiNews.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get news:", error);
    return null;
  }
}

export async function getNewsByCategory() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get news by category: database not available");
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
    console.error("[Database] Failed to get news by category:", error);
    return [];
  }
}

export async function getNewsByRegion() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get news by region: database not available");
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
    console.error("[Database] Failed to get news by region:", error);
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
    console.warn("[Database] Cannot get events list: database not available");
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
      query = query.where(and(...conditions)) as any;
    }

    const result = await query
      .orderBy(asc(aiEvents.startDate))
      .limit(input.limit || 30)
      .offset(input.offset || 0);

    return result;
  } catch (error) {
    console.error("[Database] Failed to get events list:", error);
    return [];
  }
}

export async function getAiEventById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get event: database not available");
    return null;
  }

  try {
    const result = await db.select().from(aiEvents).where(eq(aiEvents.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get event:", error);
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
    console.warn("[Database] Cannot get RSS sources: database not available");
    return [];
  }

  try {
    const result = await db.select().from(rssSources).orderBy(asc(rssSources.createdAt));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get RSS sources:", error);
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
    console.warn("[Database] Cannot insert RSS source: database not available");
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
    console.error("[Database] Failed to insert RSS source:", error);
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
    console.warn("[Database] Cannot update RSS source: database not available");
    return false;
  }

  try {
    await db.update(rssSources).set({
      ...updates,
      updatedAt: new Date(),
    }).where(eq(rssSources.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update RSS source:", error);
    return false;
  }
}

export async function deleteRssSource(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete RSS source: database not available");
    return false;
  }

  try {
    await db.delete(rssSources).where(eq(rssSources.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete RSS source:", error);
    return false;
  }
}


// Search and Read History
export async function getTrendingSearches() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get trending searches: database not available");
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
    console.error("[Database] Failed to get trending searches:", error);
    return [];
  }
}

export async function markAsRead(userId: number, newsId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot mark as read: database not available");
    return false;
  }

  try {
    await db.insert(readHistory).values({
      userId,
      newsId,
    });
    return true;
  } catch (error) {
    console.error("[Database] Failed to mark as read:", error);
    return false;
  }
}

export async function getReadNews(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get read news: database not available");
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
    console.error("[Database] Failed to get read news:", error);
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
    console.warn("[Database] Cannot check favorite: database not available");
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
    console.error("[Database] Failed to check favorite:", error);
    return false;
  }
}

export async function addSearchHistory(userId: number, query: string, resultCount: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add search history: database not available");
    return false;
  }

  try {
    await db.insert(searchHistory).values({
      userId,
      query,
      resultCount,
    });
    return true;
  } catch (error) {
    console.error("[Database] Failed to add search history:", error);
    return false;
  }
}

export async function getSearchHistory(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get search history: database not available");
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
    console.error("[Database] Failed to get search history:", error);
    return [];
  }
}



// Favorites CRUD
export async function addFavorite(userId: number, newsId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add favorite: database not available");
    return false;
  }

  try {
    await db.insert(favorites).values({
      userId,
      newsId,
    });
    return true;
  } catch (error) {
    console.error("[Database] Failed to add favorite:", error);
    return false;
  }
}

export async function removeFavorite(userId: number, newsId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot remove favorite: database not available");
    return false;
  }

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

export async function getFavorites(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get favorites: database not available");
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
    console.error("[Database] Failed to get favorites:", error);
    return [];
  }
}


// User queries
export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return null;
  }

  try {
    const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get user:", error);
    return null;
  }
}
