import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Globe, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface EventCardProps {
  id: number;
  name: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
  type: "online" | "offline";
  region: "domestic" | "international";
  speakers?: string;
  expectedAttendees?: number;
  registrationUrl?: string;
  onDetail?: (id: number) => void;
}

export function EventCard({
  id,
  name,
  description,
  startDate,
  endDate,
  location,
  type,
  region,
  speakers,
  expectedAttendees,
  registrationUrl,
  onDetail,
}: EventCardProps) {
  const typeLabel = type === "online" ? "线上" : "线下";
  const typeColor = type === "online" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800";
  const regionLabel = region === "domestic" ? "国内" : "国际";

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{name}</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Badge className={typeColor}>{typeLabel}</Badge>
              <Badge variant="outline">{regionLabel}</Badge>
            </div>
          </div>
        </div>
        <CardDescription className="line-clamp-2 mt-2">{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 日期信息 */}
        <div className="flex items-start gap-3 text-sm">
          <Calendar className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
          <div>
            <div>{format(new Date(startDate), "yyyy年 M月 d日 (EEEE)", { locale: zhCN })}</div>
            {endDate && (
              <div className="text-gray-500">
                至 {format(new Date(endDate), "yyyy年 M月 d日", { locale: zhCN })}
              </div>
            )}
          </div>
        </div>

        {/* 地点信息 */}
        {location && (
          <div className="flex items-start gap-3 text-sm">
            <MapPin className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
            <span className="text-gray-700">{location}</span>
          </div>
        )}

        {/* 讲者信息 */}
        {speakers && (
          <div className="flex items-start gap-3 text-sm">
            <Users className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
            <span className="text-gray-700 line-clamp-2">{speakers}</span>
          </div>
        )}

        {/* 参与人数 */}
        {expectedAttendees && (
          <div className="flex items-start gap-3 text-sm">
            <Globe className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
            <span className="text-gray-700">预期参与人数：约 {expectedAttendees.toLocaleString()} 人</span>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2 pt-2">
          {registrationUrl && (
            <Button
              variant="default"
              size="sm"
              asChild
              className="flex-1"
            >
              <a href={registrationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                查看详情
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          )}
        </div>
        
        {/* 数据来源 */}
        {registrationUrl && (
          <div className="pt-2 border-t text-xs text-muted-foreground">
            <span>数据来源：</span>
            <a 
              href={registrationUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              会议官网
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
