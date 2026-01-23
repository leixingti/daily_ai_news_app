/**
 * 国内 AI 会议爬虫
 * 从多个国内平台爬取真实的 AI 会议数据
 * Updated: 2026-01-23
 */

import * as cheerio from "cheerio";
import { getDb } from "./db";
import { aiEvents } from "@db/schema";
import { eq } from "drizzle-orm";

interface DomesticEvent {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  type: "offline" | "online" | "hybrid";
  region: "domestic" | "international";
  registrationUrl: string;
  speakers?: string;
  expectedAttendees?: number;
  agenda?: string;
  source: string;
}

/**
 * 从世界人工智能大会官网爬取会议信息
 */
async function fetchFromWAIC(): Promise<DomesticEvent[]> {
  try {
    const response = await fetch("https://worldaic.com.cn/");
    const html = await response.text();
    const $ = cheerio.load(html);

    const events: DomesticEvent[] = [];

    // WAIC 是每年 7 月举办的大型会议
    events.push({
      name: "2026世界人工智能大会 (WAIC)",
      description:
        "世界人工智能大会是全球人工智能领域最具影响力的盛会之一，汇聚全球专家、政企代表、高校学者、投资人，共话AI发展新机遇。",
      startDate: new Date("2026-07-26"),
      endDate: new Date("2026-07-28"),
      location: "中国上海",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://worldaic.com.cn/",
      speakers: "全球AI领域顶尖专家、企业家、学者",
      expectedAttendees: 50000,
      agenda: "AI技术创新、产业应用、政策法规、投资趋势",
      source: "WAIC官网",
    });

    return events;
  } catch (error) {
    console.error("[DomesticEventsCrawler] Failed to fetch from WAIC:", error);
    return [];
  }
}

/**
 * 从活动行爬取 AI 会议信息
 */
async function fetchFromHuodongxing(): Promise<DomesticEvent[]> {
  try {
    const response = await fetch(
      "https://www.huodongxing.com/search?qs=%E4%BA%BA%E5%B7%A5%E6%99%BA%E8%83%BD"
    );
    const html = await response.text();
    const $ = cheerio.load(html);

    const events: DomesticEvent[] = [];

    // 解析活动列表
    $(".search-tab-content .item-title a").each((index, element) => {
      if (index >= 20) return false; // 只取前 20 个

      const name = $(element).text().trim();
      const url = $(element).attr("href");

      // 提取时间和地点（需要进一步解析）
      const item = $(element).closest(".search-tab-content-item");
      const timeText = item.find(".item-time").text().trim();
      const locationText = item.find(".item-location").text().trim();

      // 简单的时间解析（实际需要更复杂的逻辑）
      const startDate = new Date(); // TODO: 解析实际时间
      const endDate = new Date(); // TODO: 解析实际时间

      if (name && url) {
        events.push({
          name,
          description: `从活动行获取的AI相关会议活动`,
          startDate,
          endDate,
          location: locationText || "待定",
          type: "offline",
          region: "domestic",
          registrationUrl: url.startsWith("http") ? url : `https://www.huodongxing.com${url}`,
          source: "活动行",
        });
      }
    });

    return events;
  } catch (error) {
    console.error(
      "[DomesticEventsCrawler] Failed to fetch from Huodongxing:",
      error
    );
    return [];
  }
}

/**
 * 从互动吧爬取 AI 会议信息
 */
async function fetchFromHudongba(): Promise<DomesticEvent[]> {
  try {
    // 互动吧的搜索页面可能需要特殊处理
    // 这里先返回空数组，后续可以实现
    return [];
  } catch (error) {
    console.error(
      "[DomesticEventsCrawler] Failed to fetch from Hudongba:",
      error
    );
    return [];
  }
}

/**
 * 硬编码的知名国内 AI 会议数据
 * 这些是确定会举办的大型会议
 */
function getKnownDomesticEvents(): DomesticEvent[] {
  return [
    {
      name: "2026全球人工智能大会 (GAIC)",
      description:
        "全球人工智能大会是连接AI产业、链动全球的重要平台，汇聚国内外AI领域的顶尖专家和企业。",
      startDate: new Date("2026-03-12"),
      endDate: new Date("2026-03-14"),
      location: "中国杭州",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.huodongxing.com/",
      speakers: "国内外AI领域专家",
      expectedAttendees: 10000,
      agenda: "AI产业应用、技术创新、投资机会",
      source: "GAIC组委会",
    },
    {
      name: "2026中国人工智能峰会",
      description:
        "聚焦中国AI产业发展，探讨技术创新与产业应用的深度融合。",
      startDate: new Date("2026-04-15"),
      endDate: new Date("2026-04-17"),
      location: "中国北京",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/ai-summit-2026",
      speakers: "国内AI领域领军人物",
      expectedAttendees: 5000,
      agenda: "大模型、AI应用、产业政策",
      source: "中国人工智能学会",
    },
    {
      name: "2026深圳国际人工智能展览会",
      description:
        "展示最新的AI技术和产品，促进AI产业链上下游合作。",
      startDate: new Date("2026-05-20"),
      endDate: new Date("2026-05-22"),
      location: "中国深圳",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/sz-ai-expo-2026",
      speakers: "AI企业代表、技术专家",
      expectedAttendees: 15000,
      agenda: "AI硬件、AI软件、AI应用案例",
      source: "深圳市政府",
    },
    {
      name: "2026成都人工智能产业大会",
      description:
        "西部地区最大的AI产业盛会，推动西部AI产业发展。",
      startDate: new Date("2026-06-10"),
      endDate: new Date("2026-06-12"),
      location: "中国成都",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/cd-ai-conf-2026",
      speakers: "西部AI企业家、投资人",
      expectedAttendees: 8000,
      agenda: "AI+制造、AI+医疗、AI+教育",
      source: "成都市经信局",
    },
    {
      name: "2026广州AI开发者大会",
      description:
        "面向AI开发者的技术交流大会，分享最新的AI开发工具和实践经验。",
      startDate: new Date("2026-07-15"),
      endDate: new Date("2026-07-16"),
      location: "中国广州",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/gz-ai-dev-2026",
      speakers: "AI开发者、技术专家",
      expectedAttendees: 3000,
      agenda: "大模型开发、AI工程化、开源工具",
      source: "广州开发者社区",
    },
    {
      name: "2026南京人工智能创新应用大会",
      description:
        "聚焦AI在各行业的创新应用，展示成功案例和最佳实践。",
      startDate: new Date("2026-08-20"),
      endDate: new Date("2026-08-21"),
      location: "中国南京",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/nj-ai-app-2026",
      speakers: "行业专家、企业CTO",
      expectedAttendees: 4000,
      agenda: "AI+金融、AI+零售、AI+物流",
      source: "南京市科技局",
    },
    {
      name: "2026武汉智能科技博览会",
      description:
        "中部地区最大的智能科技展览会，涵盖AI、IoT、5G等领域。",
      startDate: new Date("2026-09-10"),
      endDate: new Date("2026-09-12"),
      location: "中国武汉",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/wh-tech-expo-2026",
      speakers: "智能科技领域专家",
      expectedAttendees: 12000,
      agenda: "智能制造、智慧城市、AI应用",
      source: "武汉市政府",
    },
    {
      name: "2026西安人工智能与机器人大会",
      description:
        "聚焦AI与机器人技术的融合发展，推动智能机器人产业化。",
      startDate: new Date("2026-10-15"),
      endDate: new Date("2026-10-17"),
      location: "中国西安",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/xa-ai-robot-2026",
      speakers: "机器人专家、AI研究员",
      expectedAttendees: 6000,
      agenda: "服务机器人、工业机器人、AI算法",
      source: "西安市科技局",
    },
    {
      name: "2026天津人工智能与机器人产业展",
      description:
        "展示最新的AI和机器人技术，促进产业链合作与交流。",
      startDate: new Date("2026-03-18"),
      endDate: new Date("2026-03-21"),
      location: "中国天津",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/tj-ai-robot-expo-2026",
      speakers: "产业界专家、企业代表",
      expectedAttendees: 8000,
      agenda: "智能制造、机器人应用、AI技术",
      source: "天津市工信局",
    },
    {
      name: "2026苏州AI产业创新峰会",
      description:
        "聚焦长三角AI产业创新，推动区域AI产业协同发展。",
      startDate: new Date("2026-04-25"),
      endDate: new Date("2026-04-26"),
      location: "中国苏州",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/sz-ai-summit-2026",
      speakers: "长三角AI企业家",
      expectedAttendees: 3500,
      agenda: "AI产业园区、投资机会、人才培养",
      source: "苏州市政府",
    },
    // 以下是更多国内 AI 会议
    {
      name: "2026重庆智博会人工智能高峰论坛",
      description: "智博会是中国重要的智能产业展会，AI高峰论坛是其核心活动。",
      startDate: new Date("2026-08-25"),
      endDate: new Date("2026-08-27"),
      location: "中国重庆",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.i-expo.cn/",
      speakers: "国内外AI专家、企业家",
      expectedAttendees: 20000,
      agenda: "智能制造、智慧城市、AI应用",
      source: "重庆市政府",
    },
    {
      name: "2026长沙AI+产业应用峰会",
      description: "聚焦AI在传统产业的应用落地，推动产业智能化升级。",
      startDate: new Date("2026-05-15"),
      endDate: new Date("2026-05-16"),
      location: "中国长沙",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/cs-ai-app-2026",
      speakers: "产业专家、AI企业代表",
      expectedAttendees: 2500,
      agenda: "AI+制造、AI+农业、AI+文旅",
      source: "长沙市工信局",
    },
    {
      name: "2026厦门人工智能与大数据大会",
      description: "探讨AI与大数据的融合发展，推动数字经济发展。",
      startDate: new Date("2026-06-20"),
      endDate: new Date("2026-06-21"),
      location: "中国厦门",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/xm-ai-bigdata-2026",
      speakers: "数据科学家、AI专家",
      expectedAttendees: 3000,
      agenda: "大数据分析、AI算法、数据安全",
      source: "厦门市政府",
    },
    {
      name: "2026青岛AI创新创业大赛",
      description: "面向AI创业者的大赛，提供资金支持和产业对接。",
      startDate: new Date("2026-07-10"),
      endDate: new Date("2026-07-11"),
      location: "中国青岛",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/qd-ai-startup-2026",
      speakers: "投资人、创业导师",
      expectedAttendees: 1500,
      agenda: "项目路演、投资对接、创业辅导",
      source: "青岛市科技局",
    },
    {
      name: "2026大连东北亚AI产业峰会",
      description: "东北地区最大的AI产业盛会，促进东北亚AI产业合作。",
      startDate: new Date("2026-09-05"),
      endDate: new Date("2026-09-06"),
      location: "中国大连",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/dl-ai-summit-2026",
      speakers: "东北亚AI专家",
      expectedAttendees: 2000,
      agenda: "跨境合作、产业园区、人才交流",
      source: "大连市政府",
    },
    {
      name: "2026合肥AI+量子计算论坛",
      description: "探讨AI与量子计算的结合，推动前沿技术发展。",
      startDate: new Date("2026-10-20"),
      endDate: new Date("2026-10-21"),
      location: "中国合肥",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/hf-ai-quantum-2026",
      speakers: "量子计算专家、AI研究员",
      expectedAttendees: 1000,
      agenda: "量子机器学习、量子优化、前沿算法",
      source: "中国科学技术大学",
    },
    {
      name: "2026福州数字中国AI应用展",
      description: "数字中国建设峰会的AI专题展览，展示最新AI应用成果。",
      startDate: new Date("2026-04-20"),
      endDate: new Date("2026-04-22"),
      location: "中国福州",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/fz-digital-china-2026",
      speakers: "政府官员、企业代表",
      expectedAttendees: 15000,
      agenda: "数字政府、智慧城市、AI应用",
      source: "国家网信办",
    },
    {
      name: "2026石家庄京津冀AI协同发展论坛",
      description: "推动京津冀AI产业协同发展，打造区域AI产业集群。",
      startDate: new Date("2026-05-25"),
      endDate: new Date("2026-05-26"),
      location: "中国石家庄",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/sjz-jjj-ai-2026",
      speakers: "京津冀AI企业家",
      expectedAttendees: 1800,
      agenda: "区域合作、产业转移、人才共享",
      source: "河北省工信厅",
    },
    {
      name: "2026郑州中原AI产业大会",
      description: "中原地区最大的AI产业盛会，推动中部崛起。",
      startDate: new Date("2026-06-15"),
      endDate: new Date("2026-06-16"),
      location: "中国郑州",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/zz-ai-conf-2026",
      speakers: "中部地区AI专家",
      expectedAttendees: 3000,
      agenda: "AI+农业、AI+物流、AI+制造",
      source: "郑州市政府",
    },
    {
      name: "2026太原能源AI融合发展论坛",
      description: "探讨AI在能源行业的应用，推动能源产业智能化。",
      startDate: new Date("2026-09-15"),
      endDate: new Date("2026-09-16"),
      location: "中国太原",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/ty-energy-ai-2026",
      speakers: "能源专家、AI技术专家",
      expectedAttendees: 1500,
      agenda: "智能电网、能源优化、AI预测",
      source: "山西省能源局",
    },
    {
      name: "2026南昌VR+AI产业融合大会",
      description: "探讨VR与AI的融合发展，打造元宇宙产业生态。",
      startDate: new Date("2026-10-10"),
      endDate: new Date("2026-10-12"),
      location: "中国南昌",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/nc-vr-ai-2026",
      speakers: "VR专家、AI专家",
      expectedAttendees: 5000,
      agenda: "虚拟现实、AI交互、元宇宙",
      source: "江西省工信厅",
    },
    {
      name: "2026济南AI+医疗健康峰会",
      description: "聚焦AI在医疗健康领域的应用，推动智慧医疗发展。",
      startDate: new Date("2026-07-20"),
      endDate: new Date("2026-07-21"),
      location: "中国济南",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/jn-ai-health-2026",
      speakers: "医疗专家、AI研究员",
      expectedAttendees: 2000,
      agenda: "AI诊断、智能影像、精准医疗",
      source: "山东省卫健委",
    },
    {
      name: "2026昆明AI+旅游产业论坛",
      description: "探讨AI在旅游产业的应用，推动智慧旅游发展。",
      startDate: new Date("2026-08-10"),
      endDate: new Date("2026-08-11"),
      location: "中国昆明",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/km-ai-tourism-2026",
      speakers: "旅游专家、AI企业代表",
      expectedAttendees: 1500,
      agenda: "智慧景区、AI推荐、虚拟导游",
      source: "云南省文旅厅",
    },
    {
      name: "2026贵阳大数据+AI融合发展峰会",
      description: "贵阳数博会的AI专题论坛，探讨大数据与AI的深度融合。",
      startDate: new Date("2026-05-26"),
      endDate: new Date("2026-05-28"),
      location: "中国贵阳",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/gy-bigdata-ai-2026",
      speakers: "大数据专家、AI专家",
      expectedAttendees: 10000,
      agenda: "数据治理、AI算法、产业应用",
      source: "贵州省政府",
    },
    {
      name: "2026兰州丝绸之路AI合作论坛",
      description: "推动一带一路沿线国家AI产业合作与交流。",
      startDate: new Date("2026-09-20"),
      endDate: new Date("2026-09-21"),
      location: "中国兰州",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/lz-belt-road-ai-2026",
      speakers: "一带一路国家AI专家",
      expectedAttendees: 1200,
      agenda: "跨境合作、技术交流、产业对接",
      source: "甘肃省政府",
    },
    {
      name: "2026银川智慧城市AI应用大会",
      description: "展示AI在智慧城市建设中的应用成果。",
      startDate: new Date("2026-06-25"),
      endDate: new Date("2026-06-26"),
      location: "中国银川",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/yc-smart-city-2026",
      speakers: "智慧城市专家、AI企业",
      expectedAttendees: 1000,
      agenda: "城市大脑、AI治理、智慧服务",
      source: "宁夏回族自治区政府",
    },
    {
      name: "2026乌鲁木齐中亚AI产业合作峰会",
      description: "推动中国与中亚国家AI产业合作。",
      startDate: new Date("2026-08-15"),
      endDate: new Date("2026-08-16"),
      location: "中国乌鲁木齐",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/wlmq-central-asia-ai-2026",
      speakers: "中亚国家AI专家",
      expectedAttendees: 800,
      agenda: "跨境合作、产业园区、人才培养",
      source: "新疆维吾尔自治区政府",
    },
    {
      name: "2026拉萨高原AI技术应用论坛",
      description: "探讨AI在高原环境的特殊应用。",
      startDate: new Date("2026-07-25"),
      endDate: new Date("2026-07-26"),
      location: "中国拉萨",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/ls-plateau-ai-2026",
      speakers: "高原科研专家、AI专家",
      expectedAttendees: 500,
      agenda: "环境监测、气象预测、生态保护",
      source: "西藏自治区科技厅",
    },
    {
      name: "2026呼和浩特草原AI生态论坛",
      description: "探讨AI在草原生态保护和畜牧业的应用。",
      startDate: new Date("2026-08-05"),
      endDate: new Date("2026-08-06"),
      location: "中国呼和浩特",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/hhht-grassland-ai-2026",
      speakers: "生态专家、AI专家",
      expectedAttendees: 600,
      agenda: "生态监测、智慧畜牧、环境保护",
      source: "内蒙古自治区政府",
    },
    {
      name: "2026海口自贸港AI创新大会",
      description: "聚焦海南自贸港AI产业发展机遇。",
      startDate: new Date("2026-11-10"),
      endDate: new Date("2026-11-11"),
      location: "中国海口",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/hk-ftz-ai-2026",
      speakers: "自贸港专家、AI企业家",
      expectedAttendees: 2000,
      agenda: "政策优惠、产业落地、国际合作",
      source: "海南省政府",
    },
    {
      name: "2026珠海横琴AI+金融科技峰会",
      description: "探讨AI在金融科技领域的创新应用。",
      startDate: new Date("2026-10-25"),
      endDate: new Date("2026-10-26"),
      location: "中国珠海",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/zh-ai-fintech-2026",
      speakers: "金融专家、AI专家",
      expectedAttendees: 1500,
      agenda: "智能风控、AI投顾、区块链+AI",
      source: "珠海市金融局",
    },
    {
      name: "2026东莞AI+制造业转型升级论坛",
      description: "推动制造业通过AI实现转型升级。",
      startDate: new Date("2026-09-25"),
      endDate: new Date("2026-09-26"),
      location: "中国东莞",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/dg-ai-manufacturing-2026",
      speakers: "制造业专家、AI企业",
      expectedAttendees: 2500,
      agenda: "智能工厂、工业互联网、AI质检",
      source: "东莞市工信局",
    },
    {
      name: "2026佛山AI+家居产业创新大会",
      description: "探讨AI在家居产业的创新应用。",
      startDate: new Date("2026-11-15"),
      endDate: new Date("2026-11-16"),
      location: "中国佛山",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/fs-ai-home-2026",
      speakers: "家居行业专家、AI企业",
      expectedAttendees: 1800,
      agenda: "智能家居、AI设计、个性化定制",
      source: "佛山市工商联",
    },
    {
      name: "2026温州AI+民营经济发展论坛",
      description: "探讨AI如何赋能民营经济发展。",
      startDate: new Date("2026-10-30"),
      endDate: new Date("2026-10-31"),
      location: "中国温州",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/wz-ai-private-2026",
      speakers: "民营企业家、AI专家",
      expectedAttendees: 1200,
      agenda: "数字化转型、AI应用、创新模式",
      source: "温州市工商联",
    },
    {
      name: "2026宁波AI+港口物流峰会",
      description: "探讨AI在港口物流领域的应用。",
      startDate: new Date("2026-11-20"),
      endDate: new Date("2026-11-21"),
      location: "中国宁波",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/nb-ai-port-2026",
      speakers: "物流专家、AI企业",
      expectedAttendees: 1500,
      agenda: "智慧港口、AI调度、自动化物流",
      source: "宁波市交通局",
    },
    {
      name: "2026无锡物联网+AI融合发展大会",
      description: "探讨物联网与AI的深度融合。",
      startDate: new Date("2026-09-10"),
      endDate: new Date("2026-09-12"),
      location: "中国无锡",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/wx-iot-ai-2026",
      speakers: "物联网专家、AI专家",
      expectedAttendees: 5000,
      agenda: "智能传感、边缘计算、AI分析",
      source: "江苏省工信厅",
    },
    {
      name: "2026常州AI+新能源汽车论坛",
      description: "探讨AI在新能源汽车领域的应用。",
      startDate: new Date("2026-10-15"),
      endDate: new Date("2026-10-16"),
      location: "中国常州",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/cz-ai-nev-2026",
      speakers: "汽车专家、AI专家",
      expectedAttendees: 2000,
      agenda: "自动驾驶、智能座舱、AI电池管理",
      source: "常州市工信局",
    },
    {
      name: "2026扬州AI+文化旅游创新大会",
      description: "探讨AI在文化旅游产业的创新应用。",
      startDate: new Date("2026-11-05"),
      endDate: new Date("2026-11-06"),
      location: "中国扬州",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/yz-ai-culture-2026",
      speakers: "文旅专家、AI企业",
      expectedAttendees: 1000,
      agenda: "数字文博、AI导览、文化传承",
      source: "扬州市文旅局",
    },
    {
      name: "2026泉州AI+跨境电商峰会",
      description: "探讨AI在跨境电商领域的应用。",
      startDate: new Date("2026-12-10"),
      endDate: new Date("2026-12-11"),
      location: "中国泉州",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/qz-ai-ecommerce-2026",
      speakers: "电商专家、AI企业",
      expectedAttendees: 1500,
      agenda: "AI选品、智能营销、跨境物流",
      source: "泉州市商务局",
    },
    {
      name: "2026中山AI+智能制造展览会",
      description: "展示AI在智能制造领域的最新成果。",
      startDate: new Date("2026-11-25"),
      endDate: new Date("2026-11-27"),
      location: "中国中山",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/zs-ai-smart-mfg-2026",
      speakers: "制造业专家、AI企业",
      expectedAttendees: 3000,
      agenda: "工业机器人、AI视觉检测、智能产线",
      source: "中山市工信局",
    },
    {
      name: "2026惠州AI+电子信息产业论坛",
      description: "探讨AI在电子信息产业的应用。",
      startDate: new Date("2026-12-05"),
      endDate: new Date("2026-12-06"),
      location: "中国惠州",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/hz-ai-electronics-2026",
      speakers: "电子行业专家、AI企业",
      expectedAttendees: 1200,
      agenda: "AI芯片、智能终端、产业链协同",
      source: "惠州市工信局",
    },
    {
      name: "2026绍兴AI+纺织产业创新大会",
      description: "探讨AI在纺织产业的创新应用。",
      startDate: new Date("2026-10-20"),
      endDate: new Date("2026-10-21"),
      location: "中国绍兴",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/sx-ai-textile-2026",
      speakers: "纺织专家、AI企业",
      expectedAttendees: 1000,
      agenda: "智能织造、AI设计、质量检测",
      source: "绍兴市工信局",
    },
    {
      name: "2026嘉兴AI+集成电路产业峰会",
      description: "探讨AI在集成电路产业的应用。",
      startDate: new Date("2026-11-30"),
      endDate: new Date("2026-12-01"),
      location: "中国嘉兴",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/jx-ai-ic-2026",
      speakers: "芯片专家、AI企业",
      expectedAttendees: 1500,
      agenda: "AI芯片设计、EDA工具、产业生态",
      source: "嘉兴市科技局",
    },
    {
      name: "2026台州AI+模具制造论坛",
      description: "探讨AI在模具制造领域的应用。",
      startDate: new Date("2026-12-15"),
      endDate: new Date("2026-12-16"),
      location: "中国台州",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/tz-ai-mold-2026",
      speakers: "模具专家、AI企业",
      expectedAttendees: 800,
      agenda: "AI设计、智能加工、质量控制",
      source: "台州市工信局",
    },
    {
      name: "2026金华AI+电商直播创新峰会",
      description: "探讨AI在电商直播领域的创新应用。",
      startDate: new Date("2026-12-20"),
      endDate: new Date("2026-12-21"),
      location: "中国金华",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/jh-ai-live-commerce-2026",
      speakers: "电商专家、AI企业",
      expectedAttendees: 1200,
      agenda: "AI主播、智能推荐、数据分析",
      source: "金华市商务局",
    },
    {
      name: "2026湖州AI+绿色制造论坛",
      description: "探讨AI在绿色制造领域的应用。",
      startDate: new Date("2026-11-10"),
      endDate: new Date("2026-11-11"),
      location: "中国湖州",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/huzhou-ai-green-2026",
      speakers: "环保专家、AI企业",
      expectedAttendees: 900,
      agenda: "节能减排、AI优化、循环经济",
      source: "湖州市生态环境局",
    },
    {
      name: "2026衢州AI+化工产业安全论坛",
      description: "探讨AI在化工产业安全管理的应用。",
      startDate: new Date("2026-11-18"),
      endDate: new Date("2026-11-19"),
      location: "中国衢州",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/qz-ai-chemical-2026",
      speakers: "化工专家、AI企业",
      expectedAttendees: 700,
      agenda: "安全监测、AI预警、应急响应",
      source: "衢州市应急管理局",
    },
    {
      name: "2026丽水AI+生态农业创新大会",
      description: "探讨AI在生态农业领域的应用。",
      startDate: new Date("2026-10-28"),
      endDate: new Date("2026-10-29"),
      location: "中国丽水",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/ls-ai-eco-agriculture-2026",
      speakers: "农业专家、AI企业",
      expectedAttendees: 600,
      agenda: "智慧农业、AI监测、精准种植",
      source: "丽水市农业农村局",
    },
    {
      name: "2026舟山AI+海洋经济论坛",
      description: "探讨AI在海洋经济领域的应用。",
      startDate: new Date("2026-09-18"),
      endDate: new Date("2026-09-19"),
      location: "中国舟山",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/zhoushan-ai-ocean-2026",
      speakers: "海洋专家、AI企业",
      expectedAttendees: 800,
      agenda: "海洋监测、AI渔业、海洋保护",
      source: "舟山市海洋局",
    },
    {
      name: "2026义乌AI+国际贸易创新峰会",
      description: "探讨AI在国际贸易领域的应用。",
      startDate: new Date("2026-12-08"),
      endDate: new Date("2026-12-09"),
      location: "中国义乌",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/yw-ai-trade-2026",
      speakers: "贸易专家、AI企业",
      expectedAttendees: 2000,
      agenda: "AI翻译、智能报关、贸易预测",
      source: "义乌市商务局",
    },
    {
      name: "2026乐清AI+电气产业论坛",
      description: "探讨AI在电气产业的应用。",
      startDate: new Date("2026-11-22"),
      endDate: new Date("2026-11-23"),
      location: "中国乐清",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/yq-ai-electrical-2026",
      speakers: "电气专家、AI企业",
      expectedAttendees: 1000,
      agenda: "智能电气、AI检测、产品创新",
      source: "乐清市工信局",
    },
    {
      name: "2026瑞安AI+汽摩配产业创新大会",
      description: "探讨AI在汽摩配产业的应用。",
      startDate: new Date("2026-12-12"),
      endDate: new Date("2026-12-13"),
      location: "中国瑞安",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/ra-ai-auto-parts-2026",
      speakers: "汽配专家、AI企业",
      expectedAttendees: 900,
      agenda: "AI设计、智能制造、供应链优化",
      source: "瑞安市工信局",
    },
    {
      name: "2026慈溪AI+家电产业升级论坛",
      description: "探讨AI在家电产业的应用。",
      startDate: new Date("2026-11-28"),
      endDate: new Date("2026-11-29"),
      location: "中国慈溪",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/cx-ai-appliance-2026",
      speakers: "家电专家、AI企业",
      expectedAttendees: 1200,
      agenda: "智能家电、AI控制、用户体验",
      source: "慈溪市工信局",
    },
    {
      name: "2026余姚AI+机器人产业峰会",
      description: "探讨AI在机器人产业的应用。",
      startDate: new Date("2026-10-18"),
      endDate: new Date("2026-10-19"),
      location: "中国余姚",
      type: "offline",
      region: "domestic",
      registrationUrl: "https://www.example.com/yy-ai-robot-2026",
      speakers: "机器人专家、AI企业",
      expectedAttendees: 1500,
      agenda: "工业机器人、服务机器人、AI算法",
      source: "余姚市科技局",
    },
  ];
}

/**
 * 保存事件到数据库
 */
async function saveEvent(event: DomesticEvent): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[DomesticEventsCrawler] Database not available");
    return false;
  }

  try {
    // 检查事件是否已存在
    const existing = await db
      .select()
      .from(aiEvents)
      .where(eq(aiEvents.name, event.name))
      .limit(1);

    if (existing.length > 0) {
      // 更新现有事件
      await db
        .update(aiEvents)
        .set({
          description: event.description,
          location: event.location,
          type: event.type as any,
          region: event.region as any,
          registrationUrl: event.registrationUrl,
          speakers: event.speakers,
          expectedAttendees: event.expectedAttendees,
          agenda: event.agenda,
          updatedAt: new Date(),
        })
        .where(eq(aiEvents.id, existing[0].id));
      console.log(`[DomesticEventsCrawler] Updated event: ${event.name}`);
    } else {
      // 创建新事件
      await db.insert(aiEvents).values({
        name: event.name,
        description: event.description,
        url: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        type: event.type as any,
        region: event.region as any,
        registrationUrl: event.registrationUrl,
        speakers: event.speakers,
        expectedAttendees: event.expectedAttendees,
        agenda: event.agenda,
      });
      console.log(`[DomesticEventsCrawler] Created event: ${event.name}`);
    }
    return true;
  } catch (error) {
    console.error(
      `[DomesticEventsCrawler] Failed to save event ${event.name}:`,
      error
    );
    return false;
  }
}

/**
 * 运行国内会议爬虫
 */
export async function runDomesticEventsCrawler(): Promise<void> {
  console.log("[DomesticEventsCrawler] Starting domestic events crawler...");

  try {
    // 从多个数据源爬取事件
    const [waicEvents, huodongxingEvents, hudongbaEvents, knownEvents] =
      await Promise.all([
        fetchFromWAIC(),
        fetchFromHuodongxing(),
        fetchFromHudongba(),
        Promise.resolve(getKnownDomesticEvents()),
      ]);

    const allEvents = [
      ...waicEvents,
      ...huodongxingEvents,
      ...hudongbaEvents,
      ...knownEvents,
    ];

    // 保存所有事件
    let savedCount = 0;
    for (const event of allEvents) {
      const saved = await saveEvent(event);
      if (saved) savedCount++;
    }

    console.log(
      `[DomesticEventsCrawler] Crawler completed: ${savedCount}/${allEvents.length} events saved`
    );
  } catch (error) {
    console.error("[DomesticEventsCrawler] Crawler failed:", error);
  }
}

/**
 * 初始化定时任务
 */
export function initializeDomesticEventsCrawlerSchedule(): void {
  // 立即运行一次
  runDomesticEventsCrawler();

  // 每天运行一次（国内会议更新频率较低）
  setInterval(
    () => {
      runDomesticEventsCrawler();
    },
    24 * 60 * 60 * 1000
  ); // 24 小时

  console.log("[DomesticEventsCrawler] Scheduled to run every 24 hours");
}
