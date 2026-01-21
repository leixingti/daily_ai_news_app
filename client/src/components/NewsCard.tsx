import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, BookmarkPlus, BookmarkCheck, Share2, ExternalLink } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

interface NewsCardProps {
  id: number;
  title: string;
  summary: string;
  category: string;
  region: string;
  publishedAt: string | Date;
  sourceUrl: string;
  isRead?: boolean;
  isFavorited?: boolean;
  onMarkRead?: () => void;
  onFavoriteChange?: (isFav: boolean) => void;
}

const categoryColors: Record<string, string> = {
  tech: "bg-blue-100 text-blue-800",
  product: "bg-green-100 text-green-800",
  industry: "bg-purple-100 text-purple-800",
  event: "bg-orange-100 text-orange-800",
};

const regionLabels: Record<string, string> = {
  domestic: "国内",
  international: "国际",
};

export default function NewsCard({
  id,
  title,
  summary,
  category,
  region,
  publishedAt,
  sourceUrl,
  isRead = false,
  isFavorited = false,
  onMarkRead,
  onFavoriteChange,
}: NewsCardProps) {
  const { user } = useAuth();
  const [localIsFavorited, setLocalIsFavorited] = useState(isFavorited);
  const [isLoading, setIsLoading] = useState(false);

  const addFavoriteMutation = trpc.favorites.add.useMutation();
  const removeFavoriteMutation = trpc.favorites.remove.useMutation();
  const markAsReadMutation = trpc.readHistory.markAsRead.useMutation();

  const handleFavoriteClick = async () => {
    if (!user) {
      toast.error("请先登录");
      return;
    }

    setIsLoading(true);
    try {
      if (localIsFavorited) {
        await removeFavoriteMutation.mutateAsync({ newsId: id });
        setLocalIsFavorited(false);
        toast.success("已取消收藏");
      } else {
        await addFavoriteMutation.mutateAsync({ newsId: id });
        setLocalIsFavorited(true);
        toast.success("已收藏");
      }
      onFavoriteChange?.(!localIsFavorited);
    } catch (error) {
      toast.error("操作失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = async () => {
    if (!isRead && user) {
      try {
        await markAsReadMutation.mutateAsync({ newsId: id });
        onMarkRead?.();
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    }
  };

  const handleOpenNews = () => {
    handleCardClick();
    window.open(sourceUrl, "_blank");
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return d.toLocaleDateString("zh-CN");
  };

  return (
    <Card
      className={`p-4 hover:shadow-lg transition-all cursor-pointer border-l-4 ${
        isRead ? "border-l-gray-300 opacity-75" : "border-l-blue-500"
      }`}
      onClick={handleCardClick}
    >
      <div className="space-y-3">
        {/* Header with badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-lg line-clamp-2 hover:text-blue-600">
              {title}
            </h3>
            <div className="flex gap-2 flex-wrap">
              <Badge className={categoryColors[category] || "bg-gray-100 text-gray-800"}>
                {category}
              </Badge>
              <Badge variant="outline">{regionLabels[region] || region}</Badge>
              {isRead && <Badge variant="secondary">已读</Badge>}
            </div>
          </div>
        </div>

        {/* Summary */}
        <p className="text-sm text-gray-600 line-clamp-2">{summary}</p>

        {/* Footer with date and actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-gray-500">{formatDate(publishedAt)}</span>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleFavoriteClick();
              }}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              {localIsFavorited ? (
                <BookmarkCheck className="h-4 w-4 text-orange-500" />
              ) : (
                <BookmarkPlus className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigator.share?.({
                  title,
                  text: summary,
                  url: sourceUrl,
                });
              }}
              className="h-8 w-8 p-0"
            >
              <Share2 className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenNews();
              }}
              className="h-8 w-8 p-0"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
