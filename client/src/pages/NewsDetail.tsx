import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, ArrowLeft } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  
  const { data: news, isLoading } = trpc.news.detail.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  const categoryColors = {
    "技术创新": "bg-blue-100 text-blue-800 hover:bg-blue-200",
    "产品发布": "bg-green-100 text-green-800 hover:bg-green-200",
    "行业动态": "bg-purple-100 text-purple-800 hover:bg-purple-200",
    "行业会议": "bg-orange-100 text-orange-800 hover:bg-orange-200",
  };

  const categoryLabels: Record<string, string> = {
    "tech_innovation": "技术创新",
    "product_launch": "产品发布",
    "industry_news": "行业动态",
    "industry_conference": "行业会议",
  };

  const regionColors = {
    domestic: "bg-red-100 text-red-800",
    international: "bg-blue-100 text-blue-800",
  };

  const regionLabels = {
    domestic: "中国国内",
    international: "国际新闻",
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}天前`;
    } else if (hours > 0) {
      return `${hours}小时前`;
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}分钟前`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">新闻不存在</div>
      </div>
    );
  }

  // 优先显示翻译后的内容
  const displayTitle = news.region === "international" && news.titleZh 
    ? news.titleZh 
    : news.title;
  
  const displayContent = news.region === "international" && news.fullContentZh 
    ? news.fullContentZh 
    : news.content;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <Button
          variant="ghost"
          className="mb-6"          onClick={() => setLocation("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>

        {/* 新闻内容 */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* 标题 */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {displayTitle}
          </h1>

          {/* 标签 */}
          <div className="flex gap-2 mb-6">
            <Badge 
              variant="secondary" 
              className={categoryColors[news.category as keyof typeof categoryColors]}
            >
              {categoryLabels[news.category]}
            </Badge>
            <Badge 
              variant="outline" 
              className={regionColors[news.region as keyof typeof regionColors]}
            >
              {regionLabels[news.region as keyof typeof regionLabels]}
            </Badge>
          </div>

          {/* 元信息 */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-6 border-b">
            <span>{formatDate(news.publishedAt)}</span>
            <span>•</span>
            <span>{news.source}</span>
          </div>

          {/* 正文 */}
          <div className="prose prose-lg max-w-none">
            <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {displayContent}
            </p>
          </div>

          {/* 查看原文按钮 */}
          <div className="mt-8 pt-6 border-t flex justify-end">
            <Button
              variant="outline"
              onClick={() => window.open(news.sourceUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              查看原文
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
