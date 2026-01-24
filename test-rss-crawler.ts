/**
 * 测试 RSS 爬虫功能
 * 用于验证AI原厂公司RSS源是否能正常抓取
 */

import { runRSSNewsCrawler } from "./server/rssNewsCrawler";

console.log("=== 开始测试 RSS 爬虫 ===\n");
console.log("测试目标：验证AI原厂公司RSS源抓取功能");
console.log("预期结果：成功抓取OpenAI、DeepMind、Microsoft等17家AI公司的新闻\n");

runRSSNewsCrawler()
  .then(() => {
    console.log("\n=== RSS 爬虫测试完成 ===");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n=== RSS 爬虫测试失败 ===");
    console.error(error);
    process.exit(1);
  });
