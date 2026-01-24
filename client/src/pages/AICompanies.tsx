import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

interface Company {
  rank: number;
  name: string;
  nameEn?: string;
  description: string;
  website: string;
  category?: string;
  valuation?: string;
}

const globalCompanies: Company[] = [
  { rank: 1, name: "OpenAI", description: "GPT系列大模型、ChatGPT", website: "https://www.openai.com", category: "大模型" },
  { rank: 2, name: "Anthropic", description: "Claude大模型", website: "https://www.anthropic.com", category: "大模型" },
  { rank: 3, name: "Google DeepMind", description: "Gemini大模型、AlphaGo", website: "https://deepmind.google", category: "大模型" },
  { rank: 4, name: "Microsoft", description: "Azure AI、Copilot", website: "https://www.microsoft.com/ai", category: "AI平台" },
  { rank: 5, name: "NVIDIA", description: "AI芯片、CUDA平台", website: "https://www.nvidia.com", category: "硬件" },
  { rank: 6, name: "Meta AI", description: "Llama大模型、AI研究", website: "https://ai.meta.com", category: "大模型" },
  { rank: 7, name: "xAI", description: "Grok大模型", website: "https://x.ai", category: "大模型" },
  { rank: 8, name: "Cohere", description: "企业级大模型", website: "https://cohere.com", category: "大模型" },
  { rank: 9, name: "Mistral AI", description: "开源大模型", website: "https://mistral.ai", category: "大模型" },
  { rank: 10, name: "Perplexity AI", description: "AI搜索引擎", website: "https://www.perplexity.ai", category: "搜索" },
  { rank: 11, name: "Stability AI", description: "Stable Diffusion图像生成", website: "https://stability.ai", category: "AIGC" },
  { rank: 12, name: "Midjourney", description: "AI图像生成", website: "https://www.midjourney.com", category: "AIGC" },
  { rank: 13, name: "Runway", description: "AI视频生成", website: "https://runwayml.com", category: "AIGC" },
  { rank: 14, name: "Character.AI", description: "AI角色对话", website: "https://character.ai", category: "对话" },
  { rank: 15, name: "Hugging Face", description: "AI模型社区", website: "https://huggingface.co", category: "平台" },
  { rank: 16, name: "Scale AI", description: "AI数据标注", website: "https://scale.com", category: "数据" },
  { rank: 17, name: "Databricks", description: "AI数据平台", website: "https://www.databricks.com", category: "平台" },
  { rank: 18, name: "Inflection AI", description: "Pi个人AI助手", website: "https://inflection.ai", category: "助手" },
  { rank: 19, name: "Adept AI", description: "AI自动化", website: "https://www.adept.ai", category: "自动化" },
  { rank: 20, name: "Jasper", description: "AI内容创作", website: "https://www.jasper.ai", category: "AIGC" },
  { rank: 21, name: "Grammarly", description: "AI写作助手", website: "https://www.grammarly.com", category: "写作" },
  { rank: 22, name: "Notion AI", description: "AI知识管理", website: "https://www.notion.so/product/ai", category: "生产力" },
  { rank: 23, name: "Replit", description: "AI编程助手", website: "https://replit.com", category: "编程" },
  { rank: 24, name: "GitHub Copilot", description: "AI编程助手", website: "https://github.com/features/copilot", category: "编程" },
  { rank: 25, name: "Cursor", description: "AI代码编辑器", website: "https://www.cursor.com", category: "编程" },
  { rank: 26, name: "ElevenLabs", description: "AI语音合成", website: "https://elevenlabs.io", category: "语音" },
  { rank: 27, name: "Synthesia", description: "AI视频生成", website: "https://www.synthesia.io", category: "AIGC" },
  { rank: 28, name: "Replicate", description: "AI模型部署", website: "https://replicate.com", category: "平台" },
  { rank: 29, name: "Together AI", description: "开源大模型平台", website: "https://www.together.ai", category: "平台" },
  { rank: 30, name: "Anthropic", description: "AI安全研究", website: "https://www.anthropic.com", category: "研究" },
];

const chineseCompanies: Company[] = [
  { rank: 1, name: "寒武纪", nameEn: "Cambricon", description: "AI芯片", website: "https://www.cambricon.com", category: "硬件", valuation: "6300亿元" },
  { rank: 2, name: "摩尔线程", nameEn: "Moore Threads", description: "GPU", website: "https://www.mthreads.com", category: "硬件", valuation: "3100亿元" },
  { rank: 3, name: "沐曦股份", nameEn: "MetaX", description: "GPU", website: "https://www.metax-tech.com", category: "硬件", valuation: "2500亿元" },
  { rank: 4, name: "科大讯飞", nameEn: "iFlytek", description: "语音识别、星火大模型", website: "https://www.iflytek.com", category: "语音", valuation: "1300亿元" },
  { rank: 5, name: "地平线", nameEn: "Horizon Robotics", description: "车载AI芯片", website: "https://www.horizon.ai", category: "硬件", valuation: "1200亿元" },
  { rank: 6, name: "瑞芯微", nameEn: "Rockchip", description: "AI芯片", website: "https://www.rock-chips.com", category: "硬件", valuation: "1000亿元+" },
  { rank: 7, name: "壁仞科技", nameEn: "Biren Technology", description: "GPU", website: "https://www.birentech.com", category: "硬件", valuation: "1000亿元+" },
  { rank: 8, name: "商汤科技", nameEn: "SenseTime", description: "机器视觉", website: "https://www.sensetime.com", category: "视觉", valuation: "730亿元+" },
  { rank: 9, name: "稀宇极智", nameEn: "MiniMax", description: "AIGC大模型", website: "https://www.minimaxi.com", category: "大模型", valuation: "730亿元+" },
  { rank: 10, name: "芯原股份", nameEn: "VeriSilicon", description: "AI芯片IP", website: "https://www.verisilicon.com", category: "硬件", valuation: "730亿元+" },
  { rank: 11, name: "月之暗面", nameEn: "Moonshot AI", description: "Kimi大模型", website: "https://www.moonshot.cn", category: "大模型" },
  { rank: 12, name: "智谱华章", nameEn: "Zhipu AI", description: "GLM大模型", website: "https://www.zhipuai.cn", category: "大模型" },
  { rank: 13, name: "百川智能", nameEn: "Baichuan AI", description: "百川大模型", website: "https://www.baichuan-ai.com", category: "大模型" },
  { rank: 14, name: "阶跃星辰", nameEn: "StepFun", description: "Step大模型", website: "https://www.stepfun.com", category: "大模型" },
  { rank: 15, name: "小马智行", nameEn: "Pony.ai", description: "自动驾驶", website: "https://www.pony.ai", category: "自动驾驶" },
  { rank: 16, name: "文远知行", nameEn: "WeRide", description: "自动驾驶", website: "https://www.weride.ai", category: "自动驾驶" },
  { rank: 17, name: "滴滴自动驾驶", nameEn: "Didi Autonomous Driving", description: "自动驾驶", website: "https://www.didiglobal.com", category: "自动驾驶" },
  { rank: 18, name: "晶泰科技", nameEn: "XtalPi", description: "AI药物研发", website: "https://www.xtalpi.com", category: "医疗" },
  { rank: 19, name: "明略科技", nameEn: "Mininglamp", description: "数据分析决策", website: "https://www.mininglamp.com", category: "数据" },
  { rank: 20, name: "第四范式", nameEn: "4Paradigm", description: "数据分析决策", website: "https://www.4paradigm.com", category: "数据" },
  { rank: 21, name: "奥比中光", nameEn: "Orbbec", description: "3D视觉", website: "https://www.orbbec.com.cn", category: "视觉" },
  { rank: 22, name: "合合信息", nameEn: "Intsig", description: "OCR/文档识别", website: "https://www.intsig.com", category: "视觉" },
  { rank: 23, name: "云知声", nameEn: "Unisound", description: "语音识别", website: "https://www.unisound.com", category: "语音" },
  { rank: 24, name: "拓尔思", nameEn: "TRS", description: "自然语言处理", website: "https://www.trs.com.cn", category: "NLP" },
  { rank: 25, name: "云天励飞", nameEn: "Intellifusion", description: "视觉识别", website: "https://www.intellif.com", category: "视觉" },
  { rank: 26, name: "云从科技", nameEn: "CloudWalk", description: "人脸识别", website: "https://www.cloudwalk.com", category: "视觉" },
  { rank: 27, name: "天数智芯", nameEn: "Iluvatar CoreX", description: "AI芯片", website: "https://www.iluvatar.com", category: "硬件" },
  { rank: 28, name: "DeepSeek", nameEn: "DeepSeek", description: "开源大模型", website: "https://www.deepseek.com", category: "大模型" },
  { rank: 29, name: "零一万物", nameEn: "01.AI", description: "Yi大模型", website: "https://www.01.ai", category: "大模型" },
  { rank: 30, name: "秘塔科技", nameEn: "Metaso", description: "AI搜索", website: "https://metaso.cn", category: "搜索" },
];

export default function AICompanies() {
  const [activeTab, setActiveTab] = useState("global");

  const CompanyCard = ({ company }: { company: Company }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-blue-600 font-bold">#{company.rank}</span>
              <span>{company.name}</span>
              {company.nameEn && (
                <span className="text-sm text-gray-500 font-normal">({company.nameEn})</span>
              )}
            </CardTitle>
            <CardDescription className="mt-2">
              {company.description}
              {company.category && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                  {company.category}
                </span>
              )}
              {company.valuation && (
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                  {company.valuation}
                </span>
              )}
            </CardDescription>
          </div>
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="访问官网"
          >
            <ExternalLink className="w-5 h-5 text-gray-600" />
          </a>
        </div>
      </CardHeader>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">全球AI公司目录</h1>
        <p className="text-gray-600">
          收录全球和中国领先的人工智能公司，包括大模型、AI芯片、自动驾驶、AIGC等领域
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="global" className="text-lg">
            🌍 国际AI公司 Top 30
          </TabsTrigger>
          <TabsTrigger value="china" className="text-lg">
            🇨🇳 中国AI公司 Top 30
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="space-y-4">
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">国际AI公司概览</h3>
            <p className="text-sm text-blue-800">
              包括OpenAI、Anthropic、Google DeepMind等全球领先的AI公司，涵盖大模型、AI芯片、AIGC、AI平台等多个领域。
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {globalCompanies.map((company) => (
              <CompanyCard key={company.rank} company={company} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="china" className="space-y-4">
          <div className="mb-4 p-4 bg-red-50 rounded-lg">
            <h3 className="font-semibold text-red-900 mb-2">中国AI公司概览</h3>
            <p className="text-sm text-red-800">
              根据2025胡润中国人工智能企业50强榜单整理，包括寒武纪、月之暗面、智谱AI等领先AI公司。
              涵盖AI芯片、大模型、自动驾驶、机器视觉等多个领域。
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chineseCompanies.map((company) => (
              <CompanyCard key={company.rank} company={company} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
