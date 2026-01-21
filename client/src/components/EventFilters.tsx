import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Filter } from "lucide-react";

interface EventFiltersProps {
  onFilterChange: (filters: {
    type?: string;
    location?: string;
    timeStatus?: string;
    sortBy: 'date' | 'location';
    sortOrder: 'asc' | 'desc';
  }) => void;
}

export function EventFilters({ onFilterChange }: EventFiltersProps) {
  const [type, setType] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [timeStatus, setTimeStatus] = useState<string>("");
  const [sortBy, setSortBy] = useState<'date' | 'location'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  const handleApplyFilters = () => {
    onFilterChange({
      type: type || undefined,
      location: location || undefined,
      timeStatus: timeStatus || undefined,
      sortBy,
      sortOrder,
    });
  };

  const handleClearFilters = () => {
    setType("");
    setLocation("");
    setTimeStatus("");
    setSortBy('date');
    setSortOrder('desc');
    onFilterChange({
      sortBy: 'date',
      sortOrder: 'desc',
    });
  };

  const hasActiveFilters = type || location || timeStatus;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          筛选和排序
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              {[type, location, timeStatus].filter(Boolean).length}
            </Badge>
          )}
        </Button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            清除筛选
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="border rounded-lg p-4 space-y-4 bg-card">
          {/* 会议类型筛选 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">会议类型</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="选择会议类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部类型</SelectItem>
                <SelectItem value="online">线上会议</SelectItem>
                <SelectItem value="offline">线下会议</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 地点筛选 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">地点搜索</label>
            <Input
              placeholder="输入地点关键词..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* 时间状态筛选 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">时间状态</label>
            <Select value={timeStatus} onValueChange={setTimeStatus}>
              <SelectTrigger>
                <SelectValue placeholder="选择时间状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部时间</SelectItem>
                <SelectItem value="upcoming">即将开始</SelectItem>
                <SelectItem value="past">已结束</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 排序选项 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">排序依据</label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'date' | 'location')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">时间</SelectItem>
                  <SelectItem value="location">地点</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">排序顺序</label>
              <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'asc' | 'desc')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">升序</SelectItem>
                  <SelectItem value="desc">降序</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 应用按钮 */}
          <Button onClick={handleApplyFilters} className="w-full">
            应用筛选
          </Button>
        </div>
      )}
    </div>
  );
}
