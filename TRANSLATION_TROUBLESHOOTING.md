# 翻译系统故障排查指南

## 翻译系统工作原理

1. **新闻抓取**：国际AI公司的新闻被抓取后，`translationStatus` 自动设置为 `1`（待翻译）
2. **翻译调度**：服务器启动后1分钟开始第一次翻译，之后每5分钟运行一次
3. **批量处理**：每次最多处理20条待翻译的新闻
4. **API调用**：使用DeepSeek API进行翻译
5. **状态更新**：翻译成功后状态变为 `2`，失败变为 `3`

## 检查步骤

### 1. 检查Railway环境变量

在Railway项目设置中确认以下环境变量已正确设置：

```
BUILT_IN_FORGE_API_KEY=sk-xxxxx  # 您的DeepSeek API密钥
```

**重要**：如果这个变量没有设置或设置错误，翻译系统将无法工作。

### 2. 检查Railway部署日志

在Railway的Deployments页面查看日志，搜索以下关键词：

#### 正常日志应该包含：
```
[Server] Starting translation scheduler...
[Translation] Scheduled to run every 5 minutes
[Translation] Starting translation process...
[Translation] Found X news items to translate
[Translation] Translating news ID: X - [标题]
[Translation] Successfully translated news ID: X
```

#### 错误日志可能包含：
```
[Translation] Translation process failed: [错误信息]
[Translation] Failed to translate news ID: X
OPENAI_API_KEY is not configured
LLM invoke failed: 401 Unauthorized
LLM invoke failed: 429 Too Many Requests
```

### 3. 检查数据库中的翻译状态

使用Railway的PostgreSQL客户端或数据库管理工具运行以下SQL查询：

```sql
-- 查看国际新闻的翻译状态分布
SELECT 
  "translationStatus",
  COUNT(*) as count
FROM "aiNews"
WHERE region = 'international'
GROUP BY "translationStatus";

-- 查看最近的待翻译新闻
SELECT 
  id,
  title,
  source,
  "publishedAt",
  "translationStatus"
FROM "aiNews"
WHERE region = 'international' 
  AND "translationStatus" = 1
ORDER BY "publishedAt" DESC
LIMIT 10;

-- 查看最近翻译成功的新闻
SELECT 
  id,
  title,
  source,
  "publishedAt",
  "translationStatus"
FROM "aiNews"
WHERE region = 'international' 
  AND "translationStatus" = 2
ORDER BY "publishedAt" DESC
LIMIT 10;

-- 查看翻译失败的新闻
SELECT 
  id,
  title,
  source,
  "publishedAt",
  "translationStatus"
FROM "aiNews"
WHERE region = 'international' 
  AND "translationStatus" = 3
ORDER BY "publishedAt" DESC
LIMIT 10;
```

### 4. 常见问题及解决方案

#### 问题1：所有新闻的 translationStatus 都是 0 或 null
**原因**：新闻在保存时没有正确设置翻译状态  
**解决**：检查 `aiCompanyCrawlers.ts` 中的 `saveNews` 函数，确认有这行代码：
```typescript
translationStatus: news.region === "international" ? 1 : 0,
```

#### 问题2：有待翻译的新闻（status=1），但从未被翻译
**原因**：翻译调度器没有启动或API密钥错误  
**解决**：
1. 检查Railway环境变量 `BUILT_IN_FORGE_API_KEY`
2. 检查部署日志中是否有 "Starting translation scheduler" 消息
3. 检查是否有API错误日志

#### 问题3：翻译失败（status=3）
**原因**：API调用失败（密钥错误、配额用完、网络问题）  
**解决**：
1. 检查DeepSeek API密钥是否有效
2. 检查API配额是否用完
3. 查看详细的错误日志

#### 问题4：翻译速度很慢
**原因**：每次只处理20条，每条之间有2秒延迟  
**说明**：这是正常的，为了避免API速率限制。20条新闻大约需要40秒处理完成。

### 5. 手动触发翻译（调试用）

如果需要手动触发翻译进行调试，可以在Railway的服务中添加一个临时路由：

在 `server/_core/index.ts` 中添加：
```typescript
app.get("/api/trigger-translation", async (req, res) => {
  try {
    const { processAllPendingTranslations } = await import("../translationScheduler");
    processAllPendingTranslations();
    res.json({ message: "Translation triggered" });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});
```

然后访问：`https://your-app.railway.app/api/trigger-translation`

### 6. 验证翻译结果

在网站前端查看国际AI公司的新闻：
1. 打开网站
2. 筛选"AI原厂新闻"类别
3. 查看国际AI公司（OpenAI、Google DeepMind等）的新闻
4. 确认标题和内容是中文

## 当前系统状态

- ✅ 10个国际AI公司爬虫正常工作
- ✅ 翻译调度器已配置并启动
- ✅ 使用DeepSeek API进行翻译
- ⏸️ 10个国内AI公司爬虫已禁用（资源限制）

## 预期时间线

1. **新闻抓取**：每10分钟运行一次
2. **首次翻译**：服务器启动后1分钟
3. **后续翻译**：每5分钟检查一次待翻译新闻
4. **单条翻译**：约2-3秒
5. **批量翻译**：20条约40-60秒

因此，新抓取的国际新闻可能需要5-15分钟才能看到中文翻译。

## 需要帮助？

如果按照以上步骤仍无法解决问题，请提供：
1. Railway部署日志（包含 [Translation] 相关的所有日志）
2. 数据库查询结果（translationStatus 分布）
3. 环境变量配置截图（隐藏敏感信息）
