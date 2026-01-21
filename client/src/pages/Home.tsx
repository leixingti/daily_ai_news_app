import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowRight, Calendar, Newspaper, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function Home() {
  const { user, loading: authLoading } = useAuth();

  // 获取最新新闻
  const { data: newsData, isLoading: newsLoading } = trpc.news.list.useQuery({
    limit: 6,
    offset: 0,
  });

  // 获取会议列表
  const { data: eventsData, isLoading: eventsLoading } = trpc.events.list.useQuery({
    limit: 3,
    offset: 0,
  });

  const news = newsData || [];
  const events = eventsData || [];

  const categoryLabels: Record<string, string> = {
    tech: "技术创新",
    product: "产品发布",
    industry: "行业动态",
    event: "会议论坛",
  };

  const categoryColors: Record<string, string> = {
    tech: "bg-blue-100 text-blue-800",
    product: "bg-purple-100 text-purple-800",
    industry: "bg-green-100 text-green-800",
    event: "bg-orange-100 text-orange-800",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold mb-4">AI 每日新闻</h1>
            <p className="text-xl text-blue-100 mb-8">
              获取最新的 AI 行业动态、技术创新和会议信息
            </p>
            <div className="flex gap-4">
              <Link href="/events">
                <a>
                  <Button size="lg" variant="secondary" className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    浏览会议
                  </Button>
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">最新新闻</CardTitle>
              <Newspaper className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{newsLoading ? "-" : news.length}</div>
              <p className="text-xs text-gray-500">本周发布</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">行业会议</CardTitle>
              <Calendar className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{eventsLoading ? "-" : events.length}</div>
              <p className="text-xs text-gray-500">即将开始</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">热门话题</CardTitle>
              <TrendingUp className="w-4 h-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-gray-500">本周热议</p>
            </CardContent>
          </Card>
        </div>

        {/* 最新新闻 */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">最新新闻</h2>
            <Link href="/">
              <a>
                <Button variant="outline" className="flex items-center gap-2">
                  查看全部
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            </Link>
          </div>

          {newsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((item: any) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge
                        className={categoryColors[item.category] || "bg-gray-100 text-gray-800"}
                      >
                        {categoryLabels[item.category] || item.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-3 mb-4">
                      {item.summary}
                    </CardDescription>
                    <div className="text-xs text-gray-500">
                      {format(new Date(item.publishedAt), "yyyy年 M月 d日", { locale: zhCN })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 推荐会议 */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">推荐会议</h2>
            <Link href="/events">
              <a>
                <Button variant="outline" className="flex items-center gap-2">
                  查看全部
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            </Link>
          </div>

          {eventsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {events.map((event: any) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex gap-2 mb-2">
                      <Badge className={event.type === "online" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
                        {event.type === "online" ? "线上" : "线下"}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{event.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-2 mb-4">
                      {event.description}
                    </CardDescription>
                    <div className="text-xs text-gray-500">
                      {format(new Date(event.startDate), "yyyy年 M月 d日", { locale: zhCN })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* CTA 区域 */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-12 text-center">
          <h3 className="text-3xl font-bold mb-4">不想错过任何重要信息？</h3>
          <p className="text-xl text-blue-100 mb-8">
            订阅我们的新闻通讯，获取最新的 AI 行业动态
          </p>
          <Button size="lg" variant="secondary">
            立即订阅
          </Button>
        </div>
      </div>
    </div>
  );
}
