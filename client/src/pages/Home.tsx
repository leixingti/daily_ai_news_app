import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, RefreshCw, Clock, Sparkles, Settings, Circle, Calendar, Globe, MapPin, User, LogOut, Users, Video, Map as MapIcon } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { groupNewsByDate, formatRelativeTime } from "@/utils/dateGrouping";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 使用数组确保顺序一致
const categoryLabels: Record<string, string> = {
  tech: "技术创新",
  product: "产品发布",
  industry: "行业动态",
  event: "行业会议",
};

const categoryOrder = ['tech', 'product', 'industry', 'event'];

// Category color styles for all news categories
const categoryColors = {
  tech: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  product: "bg-purple-100 text-purple-700 hover:bg-purple-200",
  industry: "bg-green-100 text-green-700 hover:bg-green-200",
  event: "bg-orange-100 text-orange-700 hover:bg-orange-200", // Industry events category
};

const regionLabels = {
  domestic: "中国国内",
  international: "国际新闻",
};

const regionColors = {
  domestic: "bg-red-100 text-red-700 hover:bg-red-200",
  international: "bg-orange-100 text-orange-700 hover:bg-orange-200",
};

export default function Home() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("news");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"tech" | "product" | "industry" | "event" | undefined>();
  const [selectedRegion, setSelectedRegion] = useState<"domestic" | "international" | undefined>();
  const [orderBy] = useState<"publishedAt" | "createdAt">("publishedAt");

  // 获取新闻列表
  const { data: newsList, isLoading: isNewsLoading, refetch: refetchNews } = trpc.news.list.useQuery({
    limit: 100,
    offset: 0,
    category: selectedCategory,
    region: selectedRegion,
    searchQuery: searchQuery || undefined,
  }, {
    enabled: activeTab === "news"
  });

  // 获取会议列表
  const { data: eventsList, isLoading: isEventsLoading, refetch: refetchEvents } = trpc.events.list.useQuery({
    limit: 50,
    offset: 0,
    searchQuery: searchQuery || undefined,
  }, {
    enabled: activeTab === "events"
  });

  // 获取最后更新时间
  const { data: lastUpdateTime } = trpc.system.health.useQuery({ timestamp: Date.now() });

  // 获取用户已读的新闻 ID 列表（仅登录用户）
  const { data: readNewsData = [] } = trpc.readHistory.getReadNews.useQuery(undefined, {
    enabled: !!user,
  });
  const readNewsIds = readNewsData.map((item: any) => item.newsId);  // 按日期分组新闻
  const groupedNews = useMemo(() => {
    if (!newsList || newsList.length === 0) return [];
    return groupNewsByDate(newsList);
  }, [newsList]);

  // 刷新新闻（仅管理员）
  const refreshNewsMutation = trpc.system.notifyOwner.useMutation({
    onSuccess: () => {
      toast.success(`新闻刷新成功！`);
      refetchNews();
    },
    onError: (error: any) => {
      toast.error(`刷新失败：${error.message}`);
    },
  });

  // 刷新会议（仅管理员）
  const refreshEventsMutation = trpc.crawler.triggerCrawl.useMutation({
    onSuccess: () => {
      toast.success(`会议刷新成功！`);
      refetchEvents();
    },
    onError: (error: any) => {
      toast.error(`刷新失败：${error.message}`);
    },
  });

  const handleSearch = () => {
    if (activeTab === "news") refetchNews();
    else refetchEvents();
  };

  const handleRefresh = () => {
    if (!user) {
      toast.error("请先登录");
      return;
    }
    if (user.role !== "admin") {
      toast.error("仅管理员可以刷新数据");
      return;
    }
    
    if (activeTab === "news") {
      toast.info("正在刷新新闻，这可能需要几分钟...");
      refreshNewsMutation.mutate({ title: "新闻刷新", content: "开始刷新新闻" });
    } else {
      toast.info("正在刷新会议信息...");
      refreshEventsMutation.mutate();
    }
  };

  const formatDate = (dateString: string | Date) => {
    return formatRelativeTime(dateString);
  };

  const isUpcoming = (date: string | Date) => {
    return new Date(date) > new Date();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">每日AI新闻</h1>
                <p className="text-sm text-muted-foreground">AI行业资讯聚合平台</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user?.role === "admin" && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => window.location.href = '/rss-management'}>
                    <Settings className="w-4 h-4" />
                    RSS管理
                  </Button>
                  <Button
                    onClick={handleRefresh}
                    disabled={refreshNewsMutation.isPending || refreshEventsMutation.isPending}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${(refreshNewsMutation.isPending || refreshEventsMutation.isPending) ? "animate-spin" : ""}`} />
                    刷新{activeTab === "news" ? "新闻" : "会议"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-8">
            <TabsTrigger value="news" className="gap-2">
              <Sparkles className="w-4 h-4" />
              AI新闻
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2">
              <Calendar className="w-4 h-4" />
              AI行业会议
            </TabsTrigger>
          </TabsList>

          {/* 搜索和筛选 */}
          <div className="mb-8 space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={activeTab === "news" ? "搜索新闻标题、内容..." : "搜索会议名称、描述..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch}>搜索</Button>
            </div>

            {activeTab === "news" && (
              <>
                {/* 地区筛选 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">地区：</span>
                  <Button
                    variant={selectedRegion === undefined ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedRegion(undefined)}
                    className="gap-1"
                  >
                    <Globe className="w-4 h-4" />
                    全部
                  </Button>
                  {Object.entries(regionLabels).map(([key, label]) => (
                    <Button
                      key={key}
                      variant={selectedRegion === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedRegion(key as any)}
                      className="gap-1"
                    >
                      <MapPin className="w-4 h-4" />
                      {label}
                    </Button>
                  ))}
                </div>

                {/* 分类筛选 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">分类：</span>
                  <Button
                    variant={selectedCategory === undefined ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(undefined)}
                  >
                    全部
                  </Button>
                  {categoryOrder.map((key) => {
                    const label = categoryLabels[key];
                    return (
                      <Button
                        key={key}
                        variant={selectedCategory === key ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(key as any)}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </div>
              </>
            )}

            {/* 最后更新时间 */}
            {activeTab === "news" && lastUpdateTime && lastUpdateTime.ok && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>最后更新：{new Date().toLocaleString()}</span>
              </div>
            )}
          </div>

          <TabsContent value="news">
            {isNewsLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : newsList && newsList.length > 0 ? (
              <div className="space-y-8">
                {groupedNews.map((group: any) => (
                  <div key={group.date}>
                    <h2 className="text-lg font-semibold mb-4 text-foreground">{group.date}</h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {group.news.map((news: any) => (
                        <Card
                          key={news.id}
                          className={`overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${
                            readNewsIds.includes(news.id) ? "opacity-60" : ""
                          }`}
                          onClick={() => window.open(news.sourceUrl, "_blank")}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <Badge variant="secondary" className={categoryColors[news.category as keyof typeof categoryColors]}>
                                {categoryLabels[news.category]}
                              </Badge>
                              {readNewsIds.includes(news.id) && (
                                <Badge variant="outline" className="text-xs">已读</Badge>
                              )}
                            </div>
                            <CardTitle className="text-base line-clamp-2">{news.title}</CardTitle>
                            <CardDescription className="text-xs">
                          <Badge variant="outline" className={regionColors[news.region as keyof typeof regionColors] || "bg-gray-100 text-gray-700"}>
                            {regionLabels[news.region as keyof typeof regionLabels] || news.region}
                          </Badge>
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pb-3">
                            <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{news.summary}</p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{formatDate(news.publishedAt)}</span>
                              {news.source && <span className="text-xs">{news.source}</span>}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">暂无新闻数据</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="events">
            {isEventsLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : eventsList && eventsList.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {eventsList.map((event: any) => (
                  <Card
                    key={event.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => event.registrationUrl && window.open(event.registrationUrl, "_blank")}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                          {event.type === "online" ? "线上" : "线下"}
                        </Badge>
                        {isUpcoming(event.startDate) && (
                          <Badge className="bg-green-100 text-green-700">即将开始</Badge>
                        )}
                      </div>
                      <CardTitle className="text-base line-clamp-2">{event.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{event.description}</p>
                      <div className="space-y-2 text-xs text-muted-foreground">
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(event.startDate)}</span>
                        </div>
                        {event.expectedAttendees && (
                          <div className="flex items-center gap-2">
                            <Users className="w-3 h-3" />
                            <span>预期参与人数：{event.expectedAttendees}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">暂无会议数据</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
