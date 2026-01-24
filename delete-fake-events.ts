import "dotenv/config";
import { db } from "./server/_core/db";
import { aiEvents } from "./drizzle/schema";
import { like, or } from "drizzle-orm";

/**
 * Delete all fake events with example.com URLs from database
 */
async function deleteFakeEvents() {
  console.log("[Cleanup] Starting to delete fake events...");
  
  try {
    // Delete all events with example.com URLs
    const result = await db
      .delete(aiEvents)
      .where(
        or(
          like(aiEvents.registrationUrl, "%example.com%"),
          like(aiEvents.url, "%example.com%")
        )
      );
    
    console.log(`[Cleanup] Deleted fake events from database`);
    console.log(`[Cleanup] Result:`, result);
    
    // Count remaining events
    const remaining = await db.select().from(aiEvents);
    console.log(`[Cleanup] Remaining events: ${remaining.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error("[Cleanup] Failed to delete fake events:", error);
    process.exit(1);
  }
}

deleteFakeEvents();
