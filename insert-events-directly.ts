/**
 * 直接插入会议数据到数据库
 * 绕过爬虫调度，直接执行数据插入
 */

import { getDb } from "./server/db";
import { aiEvents } from "./drizzle/schema";

const eventsData = [
  {
    name: "NeurIPS 2026",
    nameZh: "神经信息处理系统大会 2026",
    description: "The premier conference for machine learning and computational neuroscience research.",
    descriptionZh: "机器学习和计算神经科学研究的顶级会议。",
    startDate: new Date("2026-12-07"),
    endDate: new Date("2026-12-12"),
    location: "Vancouver, Canada",
    locationZh: "加拿大温哥华",
    website: "https://neurips.cc/",
    submissionDeadline: new Date("2026-05-15"),
    tags: ["Machine Learning", "AI Research", "Neural Networks"],
    status: "upcoming",
  },
  {
    name: "ICML 2026",
    nameZh: "国际机器学习大会 2026",
    description: "International Conference on Machine Learning, a leading forum for ML research.",
    descriptionZh: "国际机器学习大会，机器学习研究的领先论坛。",
    startDate: new Date("2026-07-12"),
    endDate: new Date("2026-07-18"),
    location: "Vienna, Austria",
    locationZh: "奥地利维也纳",
    website: "https://icml.cc/",
    submissionDeadline: new Date("2026-01-28"),
    tags: ["Machine Learning", "AI Research", "Deep Learning"],
    status: "upcoming",
  },
  {
    name: "CVPR 2026",
    nameZh: "计算机视觉与模式识别大会 2026",
    description: "Computer Vision and Pattern Recognition, the top conference in computer vision.",
    descriptionZh: "计算机视觉与模式识别大会，计算机视觉领域的顶级会议。",
    startDate: new Date("2026-06-14"),
    endDate: new Date("2026-06-19"),
    location: "Seattle, USA",
    locationZh: "美国西雅图",
    website: "https://cvpr2026.thecvf.com/",
    submissionDeadline: new Date("2025-11-15"),
    tags: ["Computer Vision", "Pattern Recognition", "AI"],
    status: "upcoming",
  },
  {
    name: "AAAI 2026",
    nameZh: "人工智能促进协会大会 2026",
    description: "Association for the Advancement of Artificial Intelligence Conference.",
    descriptionZh: "人工智能促进协会大会。",
    startDate: new Date("2026-02-23"),
    endDate: new Date("2026-02-28"),
    location: "Philadelphia, USA",
    locationZh: "美国费城",
    website: "https://aaai.org/conference/aaai/aaai-26/",
    submissionDeadline: new Date("2025-08-15"),
    tags: ["AI Research", "Machine Learning", "Robotics"],
    status: "upcoming",
  },
  {
    name: "ACL 2026",
    nameZh: "计算语言学协会年会 2026",
    description: "Annual Meeting of the Association for Computational Linguistics.",
    descriptionZh: "计算语言学协会年会。",
    startDate: new Date("2026-07-26"),
    endDate: new Date("2026-07-31"),
    location: "Bangkok, Thailand",
    locationZh: "泰国曼谷",
    website: "https://2026.aclweb.org/",
    submissionDeadline: new Date("2026-02-15"),
    tags: ["NLP", "Computational Linguistics", "AI"],
    status: "upcoming",
  },
  {
    name: "ICLR 2026",
    nameZh: "国际学习表征大会 2026",
    description: "International Conference on Learning Representations.",
    descriptionZh: "国际学习表征大会。",
    startDate: new Date("2026-04-27"),
    endDate: new Date("2026-05-01"),
    location: "Kigali, Rwanda",
    locationZh: "卢旺达基加利",
    website: "https://iclr.cc/",
    submissionDeadline: new Date("2025-10-01"),
    tags: ["Deep Learning", "Representation Learning", "AI"],
    status: "upcoming",
  },
  {
    name: "IJCAI 2026",
    nameZh: "国际人工智能联合会议 2026",
    description: "International Joint Conference on Artificial Intelligence.",
    descriptionZh: "国际人工智能联合会议。",
    startDate: new Date("2026-08-21"),
    endDate: new Date("2026-08-27"),
    location: "Montreal, Canada",
    locationZh: "加拿大蒙特利尔",
    website: "https://ijcai-26.org/",
    submissionDeadline: new Date("2026-01-21"),
    tags: ["AI Research", "Multi-Agent Systems", "Knowledge Representation"],
    status: "upcoming",
  },
  {
    name: "ECCV 2026",
    nameZh: "欧洲计算机视觉大会 2026",
    description: "European Conference on Computer Vision.",
    descriptionZh: "欧洲计算机视觉大会。",
    startDate: new Date("2026-10-11"),
    endDate: new Date("2026-10-16"),
    location: "Milan, Italy",
    locationZh: "意大利米兰",
    website: "https://eccv2026.eu/",
    submissionDeadline: new Date("2026-03-07"),
    tags: ["Computer Vision", "Image Processing", "AI"],
    status: "upcoming",
  },
  {
    name: "KDD 2026",
    nameZh: "知识发现与数据挖掘大会 2026",
    description: "ACM SIGKDD Conference on Knowledge Discovery and Data Mining.",
    descriptionZh: "ACM SIGKDD 知识发现与数据挖掘大会。",
    startDate: new Date("2026-08-15"),
    endDate: new Date("2026-08-19"),
    location: "Barcelona, Spain",
    locationZh: "西班牙巴塞罗那",
    website: "https://kdd.org/kdd2026/",
    submissionDeadline: new Date("2026-02-08"),
    tags: ["Data Mining", "Knowledge Discovery", "AI Applications"],
    status: "upcoming",
  },
  {
    name: "ICCV 2027",
    nameZh: "国际计算机视觉大会 2027",
    description: "International Conference on Computer Vision (biennial).",
    descriptionZh: "国际计算机视觉大会（两年一次）。",
    startDate: new Date("2027-10-17"),
    endDate: new Date("2027-10-24"),
    location: "Paris, France",
    locationZh: "法国巴黎",
    website: "https://iccv2027.thecvf.com/",
    submissionDeadline: new Date("2027-03-15"),
    tags: ["Computer Vision", "3D Vision", "AI"],
    status: "upcoming",
  },
  {
    name: "SIGIR 2026",
    nameZh: "信息检索研究与发展国际会议 2026",
    description: "International ACM SIGIR Conference on Research and Development in Information Retrieval.",
    descriptionZh: "ACM SIGIR 信息检索研究与发展国际会议。",
    startDate: new Date("2026-07-19"),
    endDate: new Date("2026-07-23"),
    location: "Washington D.C., USA",
    locationZh: "美国华盛顿特区",
    website: "https://sigir.org/sigir2026/",
    submissionDeadline: new Date("2026-01-22"),
    tags: ["Information Retrieval", "Search", "NLP"],
    status: "upcoming",
  },
];

async function insertEvents() {
  console.log("[InsertEvents] Starting direct event insertion...");
  
  try {
    const db = await getDb();
    
    if (!db) {
      console.error("[InsertEvents] Database connection failed");
      console.error("[InsertEvents] DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");
      process.exit(1);
    }
    
    console.log("[InsertEvents] Database connected successfully");
    console.log(`[InsertEvents] Inserting ${eventsData.length} events...`);
    
    for (const event of eventsData) {
      try {
        await db.insert(aiEvents).values(event);
        console.log(`[InsertEvents] ✓ Inserted: ${event.name}`);
      } catch (error) {
        console.error(`[InsertEvents] ✗ Failed to insert ${event.name}:`, error);
      }
    }
    
    console.log("[InsertEvents] Insertion completed");
    
    // 验证插入结果
    const allEvents = await db.select().from(aiEvents);
    console.log(`[InsertEvents] Total events in database: ${allEvents.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error("[InsertEvents] Fatal error:", error);
    process.exit(1);
  }
}

insertEvents();
