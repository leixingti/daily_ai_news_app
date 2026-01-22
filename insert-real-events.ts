/**
 * 独立脚本：将真实的2026年AI会议数据插入数据库
 */

import { runRealEventsCrawler } from "./server/realEventsCrawler";

console.log("=".repeat(60));
console.log("开始插入真实的2026年AI会议数据...");
console.log("=".repeat(60));

runRealEventsCrawler()
  .then(() => {
    console.log("=".repeat(60));
    console.log("✅ 会议数据插入完成！");
    console.log("=".repeat(60));
    process.exit(0);
  })
  .catch((error) => {
    console.error("=".repeat(60));
    console.error("❌ 插入失败:", error);
    console.error("=".repeat(60));
    process.exit(1);
  });
