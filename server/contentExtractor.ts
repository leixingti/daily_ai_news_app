/**
 * 网页内容提取工具
 * 用于从新闻网站提取完整文章内容
 */

import axios from "axios";

/**
 * 从 URL 提取文章内容
 */
export async function extractArticleContent(url: string): Promise<string> {
  try {
    console.log(`[ContentExtractor] Fetching content from: ${url}`);

    // 设置请求头，模拟浏览器
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    const html = response.data;

    // 简单的内容提取逻辑
    // 移除 script 和 style 标签
    let content = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

    // 尝试提取常见的文章内容区域
    const articlePatterns = [
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      /<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*post[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<main[^>]*>([\s\S]*?)<\/main>/i,
    ];

    for (const pattern of articlePatterns) {
      const match = pattern.exec(content);
      if (match && match[1]) {
        content = match[1];
        break;
      }
    }

    // 移除所有 HTML 标签
    content = content.replace(/<[^>]+>/g, " ");

    // 清理空白字符
    content = content
      .replace(/\s+/g, " ")
      .replace(/\n+/g, "\n")
      .trim();

    // 如果内容太短，可能提取失败
    if (content.length < 100) {
      console.warn(`[ContentExtractor] Content too short (${content.length} chars), might be extraction failure`);
      return "";
    }

    // 限制内容长度（避免翻译超长文本）
    const maxLength = 3000; // 约 3000 字符
    if (content.length > maxLength) {
      content = content.substring(0, maxLength) + "...";
      console.log(`[ContentExtractor] Content truncated to ${maxLength} chars`);
    }

    console.log(`[ContentExtractor] Extracted ${content.length} chars from ${url}`);
    return content;

  } catch (error) {
    console.error(`[ContentExtractor] Failed to extract content from ${url}:`, error);
    return "";
  }
}

/**
 * 批量提取内容（带延迟）
 */
export async function extractMultipleArticles(urls: string[]): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  for (const url of urls) {
    const content = await extractArticleContent(url);
    results.set(url, content);

    // 延迟避免被封禁
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}
