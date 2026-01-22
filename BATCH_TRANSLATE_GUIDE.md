# 批量翻译国际新闻指南

本文档说明如何使用批量翻译脚本将数据库中现有的英文新闻翻译成中文。

## 使用场景

当您发现网站上的国际新闻仍然显示为英文时，可以使用这个脚本批量翻译现有数据。

## 在 Render 上运行脚本

### 步骤 1：打开 Render Shell

1. 登录 Render Dashboard：https://dashboard.render.com
2. 选择 `daily-ai-news-app` 服务
3. 点击左侧菜单的 **"Shell"**
4. 等待 Shell 连接成功

### 步骤 2：运行批量翻译脚本

在 Shell 中执行以下命令：

```bash
pnpm run translate:batch
```

### 步骤 3：等待翻译完成

脚本会自动：
1. 查询数据库中的国际新闻（最多 50 条）
2. 检测标题和摘要是否为英文
3. 并行翻译标题和摘要
4. 更新数据库

预计耗时：**5-10 分钟**（取决于新闻数量）

### 步骤 4：查看翻译结果

脚本执行完成后，会显示统计信息：
```
=== 批量翻译完成 ===
总计: 50 条
已翻译: 35 条
已跳过: 15 条
失败: 0 条
```

### 步骤 5：刷新网站验证

1. 访问网站：https://daily-ai-news-app.onrender.com
2. 点击"国际新闻"筛选
3. 确认标题和摘要都显示为中文

## 注意事项

### 1. 限制条数
脚本默认一次处理 50 条新闻，避免超时。如果需要翻译更多，可以多次运行脚本。

### 2. API 限流
脚本在每条新闻翻译后会延迟 500ms，避免 API 限流。

### 3. 错误处理
如果某条新闻翻译失败，脚本会跳过并继续处理下一条，不会中断整个流程。

### 4. 重复运行
脚本会自动检测新闻是否已是中文，如果已翻译则跳过，可以安全地重复运行。

## 本地运行（开发环境）

如果您想在本地测试脚本：

```bash
# 确保环境变量已配置
export DATABASE_URL="your_database_url"
export BUILT_IN_FORGE_API_KEY="your_api_key"

# 运行脚本
pnpm run translate:batch
```

## 脚本说明

### 文件位置
- 脚本文件：`batch-translate-news.ts`
- npm script：`translate:batch`

### 主要功能
1. **检测语言**：自动识别标题和摘要是否为英文
2. **并行翻译**：同时翻译标题和摘要，提高效率
3. **批量更新**：将翻译结果保存到数据库
4. **进度显示**：实时显示翻译进度和结果

### 翻译逻辑
```typescript
// 检测英文：英文字符占比超过 50%
function isEnglish(text: string): boolean {
  const englishChars = text.match(/[a-zA-Z]/g);
  const totalChars = text.replace(/\s/g, "").length;
  const englishRatio = englishChars.length / totalChars;
  return englishRatio > 0.5;
}
```

## 常见问题

### Q: 脚本运行失败，提示 "数据库连接失败"
**A**: 检查环境变量 `DATABASE_URL` 是否正确配置。

### Q: 翻译结果不理想
**A**: 可以手动编辑数据库中的新闻内容，或者调整翻译提示词。

### Q: 需要翻译超过 50 条新闻
**A**: 多次运行脚本即可，脚本会自动跳过已翻译的新闻。

### Q: 如何修改一次处理的新闻数量
**A**: 编辑 `batch-translate-news.ts` 文件，修改 `.limit(50)` 中的数字。

## 后续优化

未来版本可能会添加：
- [ ] 支持命令行参数指定翻译数量
- [ ] 添加翻译进度条
- [ ] 支持翻译指定日期范围的新闻
- [ ] 添加翻译质量评估

---

**如有问题，请在 GitHub Issues 中反馈。**
