import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { EventCard } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter } from "lucide-react";

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "online" | "offline">("all");
  const [regionFilter, setRegionFilter] = useState<"all" | "domestic" | "international">("domestic");
  const [timeStatus, setTimeStatus] = useState<"all" | "upcoming" | "ongoing" | "past">("upcoming");

  // 获取会议列表
  const { data: eventsData, isLoading, error } = trpc.events.list.useQuery({
    limit: 100,
    offset: 0,
    type: typeFilter === "all" ? undefined : typeFilter,
    region: regionFilter === "all" ? undefined : regionFilter,
    timeStatus: timeStatus === "all" ? undefined : timeStatus,
    searchQuery: searchQuery || undefined,
  });

  const events = eventsData || [];

  // 按时间状态分类
  const now = new Date();
  const categorizedEvents = useMemo(() => {
    return {
      upcoming: events.filter((e: any) => new Date(e.startDate) > now),
      ongoing: events.filter((e: any) => {
        const start = new Date(e.startDate);
        const end = e.endDate ? new Date(e.endDate) : new Date(start.getTime() + 24 * 60 * 60 * 1000);
        return start <= now && now <= end;
      }),
      past: events.filter((e: any) => {
        const end = e.endDate ? new Date(e.endDate) : new Date(new Date(e.startDate).getTime() + 24 * 60 * 60 * 1000);
        return end < now;
      }),
    };
  }, [events, now]);

  const displayEvents = useMemo(() => {
    switch (timeStatus) {
      case "upcoming":
        return categorizedEvents.upcoming;
      case "ongoing":
        return categorizedEvents.ongoing;
      case "past":
        return categorizedEvents.past;
      default:
        return events;
    }
  }, [timeStatus, categorizedEvents, events]);

  const handleDetail = (id: number) => {
    // TODO: 导航到会议详情页面
    console.log("View event details:", id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            AI 行业会议
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            发现最新的 AI 行业会议、论坛和峰会
          </p>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 搜索框 */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索会议名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 会议类型筛选 */}
            <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="会议类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="online">线上会议</SelectItem>
                <SelectItem value="offline">线下会议</SelectItem>
              </SelectContent>
            </Select>

            {/* 地区筛选 */}
            <Select value={regionFilter} onValueChange={(value: any) => setRegionFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="地区" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部地区</SelectItem>
                <SelectItem value="domestic">国内</SelectItem>
                <SelectItem value="international">国际</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 时间状态标签 */}
        <div className="mb-8">
          <Tabs value={timeStatus} onValueChange={(value: any) => setTimeStatus(value)}>
            <TabsList className="grid w-full grid-cols-4 max-w-md">
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="upcoming">
                即将开始
                <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                  {categorizedEvents.upcoming.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="ongoing">
                进行中
                <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                  {categorizedEvents.ongoing.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="past">
                已结束
                <span className="ml-2 text-xs bg-gray-500 text-white px-2 py-0.5 rounded-full">
                  {categorizedEvents.past.length}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* 会议列表 */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">加载失败，请稍后重试</p>
          </div>
        ) : displayEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery ? "未找到匹配的会议" : "暂无会议信息"}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => setSearchQuery("")}
              >
                清除搜索
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayEvents.map((event: any) => (
              <EventCard
                key={event.id}
                id={event.id}
                name={event.name}
                description={event.description}
                startDate={new Date(event.startDate)}
                endDate={event.endDate ? new Date(event.endDate) : undefined}
                location={event.location}
                type={event.type as "online" | "offline"}
                region={event.region as "domestic" | "international"}
                speakers={event.speakers}
                expectedAttendees={event.expectedAttendees}
                registrationUrl={event.registrationUrl}
                onDetail={handleDetail}
              />
            ))}
          </div>
        )}

        {/* 统计信息 */}
        {!isLoading && displayEvents.length > 0 && (
          <div className="mt-12 text-center text-gray-600 dark:text-gray-400">
            <p>
              共找到 <span className="font-bold text-gray-900 dark:text-white">{displayEvents.length}</span> 场会议
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
