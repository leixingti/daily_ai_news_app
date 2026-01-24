import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Sparkles } from "lucide-react";

interface LLMCompany {
  rank: number;
  name: string;
  nameEn?: string;
  models: string;
  category: string;
  website: string;
  country: string;
}

const globalLLMCompanies: LLMCompany[] = [
  { rank: 1, name: "OpenAI", models: "GPT-5.2, GPT-5.1, o3, GPT-4o", category: "大模型", website: "https://openai.com", country: "美国" },
  { rank: 2, name: "Anthropic", models: "Claude Opus 4.5, Claude 4.5 Sonnet", category: "大模型", website: "https://anthropic.com", country: "美国" },
  { rank: 3, name: "Google DeepMind", models: "Gemini 3 Pro, Gemini 3 Flash", category: "大模型", website: "https://deepmind.google", country: "美国" },
  { rank: 4, name: "xAI", models: "Grok 4, Grok 4.1 Fast", category: "大模型", website: "https://x.ai", country: "美国" },
  { rank: 5, name: "DeepSeek", nameEn: "深度求索", models: "DeepSeek V3.2, DeepSeek-OCR", category: "大模型", website: "https://deepseek.com", country: "中国" },
  { rank: 6, name: "Zhipu AI", nameEn: "智谱AI", models: "GLM-4.7", category: "大模型", website: "https://zhipuai.cn", country: "中国" },
  { rank: 7, name: "Meta AI", models: "Llama 4, Llama 3.3, Llama 3.1", category: "大模型", website: "https://ai.meta.com", country: "美国" },
  { rank: 8, name: "Kimi", nameEn: "月之暗面", models: "Kimi K2 Thinking", category: "大模型", website: "https://kimi.ai", country: "中国" },
  { rank: 9, name: "MiniMax", models: "MiniMax-M2.1", category: "大模型", website: "https://minimax.chat", country: "中国" },
  { rank: 10, name: "Mistral AI", models: "Mistral Large 2, Mistral Small", category: "大模型", website: "https://mistral.ai", country: "法国" },
  { rank: 11, name: "Cohere", models: "Command R+, Command R", category: "大模型", website: "https://cohere.com", country: "加拿大" },
  { rank: 12, name: "Microsoft", models: "Phi-4, Phi-3.5", category: "AI平台", website: "https://microsoft.com/ai", country: "美国" },
  { rank: 13, name: "Amazon", models: "Nova 2.0 Pro Preview", category: "AI平台", website: "https://aws.amazon.com/ai", country: "美国" },
  { rank: 14, name: "Alibaba", nameEn: "阿里巴巴", models: "Qwen 3, Qwen 2.5", category: "大模型", website: "https://tongyi.aliyun.com", country: "中国" },
  { rank: 15, name: "Baidu", nameEn: "百度", models: "ERNIE 4.0", category: "大模型", website: "https://yiyan.baidu.com", country: "中国" },
  { rank: 16, name: "ByteDance", nameEn: "字节跳动", models: "Doubao (豆包)", category: "大模型", website: "https://doubao.com", country: "中国" },
  { rank: 17, name: "Tencent", nameEn: "腾讯", models: "Hunyuan (混元)", category: "大模型", website: "https://hunyuan.tencent.com", country: "中国" },
  { rank: 18, name: "01.AI", models: "Yi-Lightning, Yi-Large", category: "大模型", website: "https://01.ai", country: "中国" },
  { rank: 19, name: "Xiaomi", nameEn: "小米", models: "MiMo-V2-Flash", category: "大模型", website: "https://xiaoai.mi.com", country: "中国" },
  { rank: 20, name: "Perplexity", models: "Sonar Pro", category: "AI搜索", website: "https://perplexity.ai", country: "美国" },
  { rank: 21, name: "Reka AI", models: "Reka Core", category: "大模型", website: "https://reka.ai", country: "新加坡" },
  { rank: 22, name: "AI21 Labs", models: "Jamba 1.5", category: "大模型", website: "https://ai21.com", country: "以色列" },
  { rank: 23, name: "Inflection AI", models: "Inflection 3", category: "大模型", website: "https://inflection.ai", country: "美国" },
  { rank: 24, name: "Writer", models: "Palmyra X4", category: "AI写作", website: "https://writer.com", country: "美国" },
  { rank: 25, name: "Databricks", models: "DBRX", category: "AI平台", website: "https://databricks.com", country: "美国" },
  { rank: 26, name: "Stability AI", models: "Stable LM", category: "大模型", website: "https://stability.ai", country: "英国" },
  { rank: 27, name: "Together AI", models: "Together Inference", category: "AI平台", website: "https://together.ai", country: "美国" },
  { rank: 28, name: "Fireworks AI", models: "Fireworks Models", category: "AI平台", website: "https://fireworks.ai", country: "美国" },
  { rank: 29, name: "Groq", models: "Groq Inference", category: "AI推理", website: "https://groq.com", country: "美国" },
  { rank: 30, name: "Hugging Face", models: "HuggingChat Models", category: "AI平台", website: "https://huggingface.co", country: "美国" },
  { rank: 31, name: "IBM", models: "Granite 4.0", category: "大模型", website: "https://ibm.com/ai", country: "美国" },
  { rank: 32, name: "NVIDIA", models: "Nemotron Nano", category: "AI芯片", website: "https://nvidia.com/ai", country: "美国" },
  { rank: 33, name: "Apple", models: "Apple Intelligence Models", category: "AI平台", website: "https://apple.com/apple-intelligence", country: "美国" },
  { rank: 34, name: "Samsung", models: "Samsung Gauss", category: "大模型", website: "https://samsung.com/ai", country: "韩国" },
  { rank: 35, name: "LG AI Research", models: "EXAONE 3.0", category: "大模型", website: "https://lgresearch.ai", country: "韩国" },
  { rank: 36, name: "Naver", models: "HyperCLOVA X", category: "大模型", website: "https://clova.ai", country: "韩国" },
  { rank: 37, name: "Kakao", models: "KoGPT", category: "大模型", website: "https://kakao.ai", country: "韩国" },
  { rank: 38, name: "Yandex", models: "YaLM", category: "大模型", website: "https://yandex.com/ai", country: "俄罗斯" },
  { rank: 39, name: "Sberbank", models: "GigaChat", category: "大模型", website: "https://gigachat.ru", country: "俄罗斯" },
  { rank: 40, name: "Adept", models: "Fuyu", category: "AI自动化", website: "https://adept.ai", country: "美国" },
  { rank: 41, name: "Contextual AI", models: "RAG 2.0", category: "AI平台", website: "https://contextual.ai", country: "美国" },
  { rank: 42, name: "Cohere For AI", models: "Aya", category: "大模型", website: "https://cohere.com", country: "加拿大" },
  { rank: 43, name: "Snowflake", models: "Arctic", category: "AI平台", website: "https://snowflake.com", country: "美国" },
  { rank: 44, name: "Salesforce", models: "xGen", category: "AI平台", website: "https://salesforce.com/ai", country: "美国" },
  { rank: 45, name: "SAP", models: "SAP AI Core", category: "AI平台", website: "https://sap.com/ai", country: "德国" },
  { rank: 46, name: "Oracle", models: "Oracle AI", category: "AI平台", website: "https://oracle.com/ai", country: "美国" },
  { rank: 47, name: "Shopify", models: "Sidekick AI", category: "AI助手", website: "https://shopify.com", country: "加拿大" },
  { rank: 48, name: "Zoom", models: "Zoom AI Companion", category: "AI助手", website: "https://zoom.us", country: "美国" },
  { rank: 49, name: "KwaiKAT", models: "KAT-Coder-Pro V1", category: "AI编程", website: "https://kuaishou.com", country: "中国" },
  { rank: 50, name: "Moonshot AI", nameEn: "月之暗面", models: "Moonshot", category: "大模型", website: "https://moonshot.cn", country: "中国" },
];

export default function LLMCompanies() {
  const usCompanies = globalLLMCompanies.filter(c => c.country === "美国");
  const chinaCompanies = globalLLMCompanies.filter(c => c.country === "中国");
  const otherCompanies = globalLLMCompanies.filter(c => c.country !== "美国" && c.country !== "中国");

  const CompanyCard = ({ company }: { company: LLMCompany }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-blue-600 font-bold">#{company.rank}</span>
              {company.name}
              {company.nameEn && (
                <span className="text-sm text-gray-500 font-normal">({company.nameEn})</span>
              )}
            </CardTitle>
            <CardDescription className="mt-1 text-sm">
              {company.models}
            </CardDescription>
          </div>
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
            title="访问官网"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Badge variant="secondary">{company.category}</Badge>
          <Badge variant="outline">{company.country}</Badge>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 flex items-center justify-center gap-3">
            <Sparkles className="w-10 h-10 text-blue-600" />
            全球AI大模型公司目录
          </h1>
          <p className="text-gray-600 text-lg">
            收录全球领先的大语言模型（LLM）公司，基于 Artificial Analysis 排名
          </p>
          <p className="text-gray-500 text-sm mt-2">
            数据来源：Artificial Analysis LLM Leaderboard | 更新时间：2026年1月
          </p>
        </div>

        {/* 标签页 */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="all">🌍 全球 Top 50</TabsTrigger>
            <TabsTrigger value="us">🇺🇸 美国公司</TabsTrigger>
            <TabsTrigger value="china">🇨🇳 中国公司</TabsTrigger>
            <TabsTrigger value="other">🌏 其他国家</TabsTrigger>
          </TabsList>

          {/* 全球 Top 50 */}
          <TabsContent value="all">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">全球AI大模型公司概览</h2>
              <p className="text-gray-600">
                包括OpenAI、Anthropic、Google DeepMind、DeepSeek等全球领先的AI大模型公司，
                涵盖GPT、Claude、Gemini、Llama等主流大语言模型。
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {globalLLMCompanies.map((company) => (
                <CompanyCard key={company.rank} company={company} />
              ))}
            </div>
          </TabsContent>

          {/* 美国公司 */}
          <TabsContent value="us">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">美国AI大模型公司</h2>
              <p className="text-gray-600">
                美国拥有全球最多的顶级AI大模型公司，包括OpenAI、Anthropic、Google、Meta等行业领导者。
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {usCompanies.map((company) => (
                <CompanyCard key={company.rank} company={company} />
              ))}
            </div>
          </TabsContent>

          {/* 中国公司 */}
          <TabsContent value="china">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">中国AI大模型公司</h2>
              <p className="text-gray-600">
                中国AI大模型发展迅速，DeepSeek、智谱AI、阿里巴巴、百度、字节跳动等公司表现亮眼。
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chinaCompanies.map((company) => (
                <CompanyCard key={company.rank} company={company} />
              ))}
            </div>
          </TabsContent>

          {/* 其他国家 */}
          <TabsContent value="other">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">其他国家AI大模型公司</h2>
              <p className="text-gray-600">
                包括法国Mistral AI、加拿大Cohere、韩国Samsung/LG/Naver、俄罗斯Yandex等公司。
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherCompanies.map((company) => (
                <CompanyCard key={company.rank} company={company} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
