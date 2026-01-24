/**
 * Test script to manually run AI company crawlers
 */
import "dotenv/config";
import { runAllAICompanyCrawlers } from "./server/aiCompanyCrawlers";

async function main() {
  console.log("=".repeat(60));
  console.log("Testing AI Company Crawlers");
  console.log("=".repeat(60));
  
  try {
    await runAllAICompanyCrawlers();
    console.log("\n✅ All crawlers completed successfully!");
  } catch (error) {
    console.error("\n❌ Crawler test failed:", error);
    process.exit(1);
  }
}

main();
