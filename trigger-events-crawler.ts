import { runEventsCrawler } from "./server/eventsCrawler";

async function main() {
  console.log("Manually triggering events crawler...");
  await runEventsCrawler();
  console.log("Done!");
  process.exit(0);
}

main();
