import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { InsertUser, users, aiNews, favorites, searchHistory, readHistory, aiEvents, rssSources, systemConfig } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let pool: Pool | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      console.log("[DB] Initializing PostgreSQL connection with pg...");
      
      // Create connection pool
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      // Test connection
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log("[DB] PostgreSQL connection test successful");

      _db = drizzle(pool);
      console.log("[Database] Connected successfully");
    } catch (error) {
      console.error("[DB] Failed to connect:", error);
      _db = null;
      if (pool) {
        await pool.end();
        pool = null;
      }
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
      values[field] = value;
      updateSet[field] = value;
    };

    assignNullable("name");
    assignNullable("email");
    assignNullable("loginMethod");

    const result = await db
      .insert(users)
      .values(values)
      .onConflictDoUpdate({
        target: users.openId,
        set: updateSet,
      });

    console.log("[Database] User upserted successfully");
  } catch (error) {
    console.error("[Database] Error upserting user:", error);
  }
}

export async function getNewsList(limit: number = 20, offset: number = 0) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[DB] Cannot get news list: database not available");
      return [];
    }

    const news = await db
      .select()
      .from(aiNews)
      .limit(limit)
      .offset(offset);

    return news;
  } catch (error) {
    console.error("[DB] Error fetching news list:", error);
    return [];
  }
}

export async function getEventsList(limit: number = 20, offset: number = 0) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[DB] Cannot get events list: database not available");
      return [];
    }

    const events = await db
      .select()
      .from(aiEvents)
      .limit(limit)
      .offset(offset);

    return events;
  } catch (error) {
    console.error("[DB] Error fetching events list:", error);
    return [];
  }
}

export async function searchNews(query: string, limit: number = 20) {
  try {
    const db = await getDb();
    if (!db) {
      return [];
    }

    const results = await db
      .select()
      .from(aiNews)
      .limit(limit);

    return results;
  } catch (error) {
    console.error("[DB] Error searching news:", error);
    return [];
  }
}

export async function getAiEventById(id: number) {
  try {
    const db = await getDb();
    if (!db) {
      return null;
    }

    const event = await db
      .select()
      .from(aiEvents)
      .where((col) => col.id === id)
      .limit(1);

    return event[0] || null;
  } catch (error) {
    console.error("[DB] Error fetching event:", error);
    return null;
  }
}

export async function getAiNewsList(params: any) {
  try {
    const db = await getDb();
    if (!db) {
      return [];
    }

    const news = await db
      .select()
      .from(aiNews)
      .limit(params.limit || 20)
      .offset(params.offset || 0);

    return news;
  } catch (error) {
    console.error("[DB] Error fetching AI news list:", error);
    return [];
  }
}

export async function getAiEventsList(params: any) {
  try {
    const db = await getDb();
    if (!db) {
      return [];
    }

    const events = await db
      .select()
      .from(aiEvents)
      .limit(params.limit || 20)
      .offset(params.offset || 0);

    return events;
  } catch (error) {
    console.error("[DB] Error fetching AI events list:", error);
    return [];
  }
}

export async function isFavorited(userId: number, newsId: number) {
  try {
    const db = await getDb();
    if (!db) {
      return false;
    }

    const result = await db
      .select()
      .from(favorites)
      .where((col) => col.userId === userId && col.newsId === newsId)
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error("[DB] Error checking favorite:", error);
    return false;
  }
}

export async function markAsRead(userId: number, newsId: number) {
  try {
    const db = await getDb();
    if (!db) {
      return false;
    }

    await db
      .insert(readHistory)
      .values({
        userId,
        newsId,
        readAt: new Date(),
      });

    return true;
  } catch (error) {
    console.error("[DB] Error marking as read:", error);
    return false;
  }
}

export async function getReadNews(userId: number) {
  try {
    const db = await getDb();
    if (!db) {
      return [];
    }

    const result = await db
      .select()
      .from(readHistory)
      .where((col) => col.userId === userId);

    return result;
  } catch (error) {
    console.error("[DB] Error fetching read news:", error);
    return [];
  }
}

export async function getTrendingSearches(limit: number = 10) {
  try {
    const db = await getDb();
    if (!db) {
      return [];
    }

    const result = await db
      .select()
      .from(searchHistory)
      .limit(limit);

    return result;
  } catch (error) {
    console.error("[DB] Error fetching trending searches:", error);
    return [];
  }
}

export async function getAllRssSources() {
  try {
    const db = await getDb();
    if (!db) {
      return [];
    }

    const result = await db
      .select()
      .from(rssSources);

    return result;
  } catch (error) {
    console.error("[DB] Error fetching RSS sources:", error);
    return [];
  }
}

export async function insertRssSource(data: any) {
  try {
    const db = await getDb();
    if (!db) {
      return false;
    }

    await db
      .insert(rssSources)
      .values({
        name: data.name,
        url: data.url,
        description: data.description,
        region: data.region || 'international',
      });

    return true;
  } catch (error) {
    console.error("[DB] Error inserting RSS source:", error);
    return false;
  }
}

export async function updateRssSource(id: number, data: any) {
  try {
    const db = await getDb();
    if (!db) {
      return false;
    }

    await db
      .update(rssSources)
      .set(data)
      .where((col) => col.id === id);

    return true;
  } catch (error) {
    console.error("[DB] Error updating RSS source:", error);
    return false;
  }
}

export async function deleteRssSource(id: number) {
  try {
    const db = await getDb();
    if (!db) {
      return false;
    }

    await db
      .delete(rssSources)
      .where((col) => col.id === id);

    return true;
  } catch (error) {
    console.error("[DB] Error deleting RSS source:", error);
    return false;
  }
}

export async function removeFavorite(userId: number, newsId: number) {
  try {
    const db = await getDb();
    if (!db) {
      return false;
    }

    await db
      .delete(favorites)
      .where((col) => col.userId === userId && col.newsId === newsId);

    return true;
  } catch (error) {
    console.error("[DB] Error removing favorite:", error);
    return false;
  }
}

export async function getFavorites(userId: number) {
  try {
    const db = await getDb();
    if (!db) {
      return [];
    }

    const result = await db
      .select()
      .from(favorites)
      .where((col) => col.userId === userId);

    return result;
  } catch (error) {
    console.error("[DB] Error fetching favorites:", error);
    return [];
  }
}

export async function addSearchHistory(userId: number, query: string) {
  try {
    const db = await getDb();
    if (!db) {
      return false;
    }

    await db
      .insert(searchHistory)
      .values({
        userId,
        query,
        searchedAt: new Date(),
      });

    return true;
  } catch (error) {
    console.error("[DB] Error adding search history:", error);
    return false;
  }
}

export async function getSearchHistory(userId: number) {
  try {
    const db = await getDb();
    if (!db) {
      return [];
    }

    const result = await db
      .select()
      .from(searchHistory)
      .where((col) => col.userId === userId);

    return result;
  } catch (error) {
    console.error("[DB] Error fetching search history:", error);
    return [];
  }
}

export async function addFavorite(userId: number, newsId: number) {
  try {
    const db = await getDb();
    if (!db) {
      return false;
    }

    await db
      .insert(favorites)
      .values({
        userId,
        newsId,
      });

    return true;
  } catch (error) {
    console.error("[DB] Error adding favorite:", error);
    return false;
  }
}
