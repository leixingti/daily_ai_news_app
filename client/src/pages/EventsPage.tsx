import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { EventCard } from "@/components/EventCard";
import { EventFilters } from "@/components/EventFilters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [region, setRegion] = useState<string>(); // 地区筛选：国内/国外
  const [type, setType] = useState<string>();
  const [location, setLocation] = useState<string>();
  const [timeStatus, setTimeStatus] = useState<string>();
  const [sortBy, setSortBy] = useState<'date' | 'location'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 获取会议列表
  const { data: eventsData, isLoading } = trpc.events.list.useQuery({
    limit: 100,
    offset: 0,
    region, // 添加地区筛选
    type,
    location,
    timeStatus,
    searchQuery: searchQuery || undefined,
    sortBy,
    sortOrder,
  });

  const events = eventsData || [];

  const handleFilterChange = (filters: {
    type?: string;
    location?: string;
    timeStatus?: string;
    sortBy: 'date' | 'location';
    sortOrder: 'asc' | 'desc';
  }) => {
    setType(filters.type);
    setLocation(filters.location);
    setTimeStatus(filters.timeStatus);
    setSortBy(filters.sortBy);
    setSortOrder(filters.sortOrder);
  };

  const handleSearch = () => {
    // 搜索会自动触发查询
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">AI行业会议</h1>
              <p className="text-sm text-muted-foreground">发现最新的 AI 行业会议、论坛和峰会</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* 搜索框 */}
        <div className="mb-8">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="搜索会议名称、描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>搜索</Button>
          </div>
        </div>

        {/* 地区筛选 */}
        <div className="mb-6">
          <div className="flex gap-2">
            <Button
              variant={region === undefined ? "default" : "outline"}
              size="sm"
              onClick={() => setRegion(undefined)}
            >
              全部
            </Button>
            <Button
              variant={region === "domestic" ? "default" : "outline"}
              size="sm"
              onClick={() => setRegion("domestic")}
            >
              国内会议
            </Button>
            <Button
              variant={region === "international" ? "default" : "outline"}
              size="sm"
              onClick={() => setRegion("international")}
            >
              国外会议
            </Button>
          </div>
        </div>

        {/* 筛选和排序组件 */}
        <div className="mb-8">
          <EventFilters onFilterChange={handleFilterChange} />
        </div>

        {/* 会议列表 */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-lg border p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event: any) => (
              <EventCard
                key={event.id}
                id={event.id}
                name={event.name}
                description={event.description}
                startDate={event.startDate}
                endDate={event.endDate}
                location={event.location}
                type={event.type}
                region={event.region}
                speakers={event.speakers}
                expectedAttendees={event.expectedAttendees}
                registrationUrl={event.registrationUrl}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">暂无会议数据</p>
          </div>
        )}
      </main>
    </div>
  );
}
