/**
 * 日期分组工具函数
 * 将新闻按"今天"、"昨天"、"本周"、"更早"等时间段分组
 */

export type DateGroup = "今天" | "昨天" | "本周" | "更早";

interface NewsItem {
  id: number;
  publishedAt: Date | string;
  [key: string]: any;
}

interface GroupedNews<T extends NewsItem> {
  group: DateGroup;
  news: T[];
}

/**
 * 判断日期属于哪个分组
 */
export function getDateGroup(date: Date | string): DateGroup {
  const newsDate = new Date(date);
  const now = new Date();
  
  // 重置时间到当天的00:00:00，便于比较日期
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const newsDateStart = new Date(newsDate.getFullYear(), newsDate.getMonth(), newsDate.getDate());
  
  // 计算日期差（天数）
  const diffTime = todayStart.getTime() - newsDateStart.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return "今天";
  } else if (diffDays === 1) {
    return "昨天";
  } else if (diffDays <= 7) {
    return "本周";
  } else {
    return "更早";
  }
}

/**
 * 将新闻列表按日期分组
 */
export function groupNewsByDate<T extends NewsItem>(newsList: T[]): GroupedNews<T>[] {
  // 定义分组顺序
  const groupOrder: DateGroup[] = ["今天", "昨天", "本周", "更早"];
  
  // 按分组归类新闻
  const grouped = new Map<DateGroup, T[]>();
  
  newsList.forEach((news) => {
    const group = getDateGroup(news.publishedAt);
    if (!grouped.has(group)) {
      grouped.set(group, []);
    }
    grouped.get(group)!.push(news);
  });
  
  // 按预定义顺序返回分组结果
  const result: GroupedNews<T>[] = [];
  groupOrder.forEach((group) => {
    const newsInGroup = grouped.get(group);
    if (newsInGroup && newsInGroup.length > 0) {
      result.push({
        group,
        news: newsInGroup,
      });
    }
  });
  
  return result;
}

/**
 * 格式化相对时间（用于显示"X小时前"、"X天前"等）
 */
export function formatRelativeTime(date: Date | string): string {
  const newsDate = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - newsDate.getTime();
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) {
    return "刚刚";
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else {
    return `${diffDays}天前`;
  }
}
