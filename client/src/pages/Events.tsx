import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, MapPin, Users, ExternalLink } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Events() {
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [timeStatus, setTimeStatus] = useState<string>("upcoming");
  const [currentPage, setCurrentPage] = useState(0);

  const limit = 20;
  const offset = currentPage * limit;

  const { data: events, isLoading } = trpc.events.list.useQuery({
    limit,
    offset,
    type: selectedType || undefined,
    region: selectedRegion || undefined,
    timeStatus: timeStatus || undefined,
  });

  const typeColors: Record<string, string> = {
    online: "bg-blue-100 text-blue-800",
    offline: "bg-green-100 text-green-800",
  };

  const regionLabels: Record<string, string> = {
    domestic: "国内",
    international: "国际",
  };

  const typeLabels: Record<string, string> = {
    online: "线上",
    offline: "线下",
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">AI 行业会议</h1>

          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <Select value={timeStatus} onValueChange={setTimeStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="选择时间" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">即将举行</SelectItem>
                <SelectItem value="past">已结束</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="选择类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部类型</SelectItem>
                <SelectItem value="online">线上</SelectItem>
                <SelectItem value="offline">线下</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="选择地区" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部地区</SelectItem>
                <SelectItem value="domestic">国内</SelectItem>
                <SelectItem value="international">国际</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : events && events.length > 0 ? (
          <div className="space-y-4">
            {events.map((event: any) => (
              <Card key={event.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {event.name}
                      </h3>
                      <div className="flex gap-2 flex-wrap">
                        <Badge className={typeColors[event.type] || "bg-gray-100"}>
                          {typeLabels[event.type] || event.type}
                        </Badge>
                        <Badge variant="outline">
                          {regionLabels[event.region] || event.region}
                        </Badge>
                      </div>
                    </div>
                    {event.registrationUrl && (
                      <Button asChild size="sm">
                        <a href={event.registrationUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          注册
                        </a>
                      </Button>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 line-clamp-2">{event.description}</p>

                  {/* Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDate(event.startDate)}
                        {event.endDate && ` - ${formatDate(event.endDate)}`}
                      </span>
                    </div>

                    {event.location && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    )}

                    {event.expectedAttendees && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>预期 {event.expectedAttendees} 人</span>
                      </div>
                    )}
                  </div>

                  {/* Speakers */}
                  {event.speakers && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-semibold text-gray-600 mb-1">讲者</p>
                      <p className="text-sm text-gray-700">{event.speakers}</p>
                    </div>
                  )}

                  {/* Agenda */}
                  {event.agenda && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-semibold text-gray-600 mb-1">议程</p>
                      <p className="text-sm text-gray-700 line-clamp-2">{event.agenda}</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                上一页
              </Button>
              <span className="flex items-center px-4">
                第 {currentPage + 1} 页
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={events.length < limit}
              >
                下一页
              </Button>
            </div>
          </div>
        ) : (
          <Card className="p-8 text-center text-gray-500">
            <p>暂无会议数据</p>
          </Card>
        )}
      </main>
    </div>
  );
}
