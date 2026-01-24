# 每日AI新闻聚合应用 - 项目状态报告

## 📊 当前状态总览

### ✅ 正常工作的功能

1. **国际AI公司新闻爬虫**（10家）
   - OpenAI
   - Google DeepMind
   - Anthropic
   - Meta AI
   - Hugging Face
   - Microsoft AI
   - NVIDIA AI
   - AWS AI
   - Cohere
   - Mistral AI
   
   **状态**：每10分钟自动抓取最新新闻，使用RSS源，稳定可靠

2. **自动翻译系统**
   - 使用DeepSeek API
   - 每5分钟检查待翻译的国际新闻
   - 每次处理最多20条新闻
   - 翻译成功后更新数据库
   
   **状态**：已部署并配置，需要确认Railway环境变量正确设置

3. **新闻分类**
   - "AI原厂新闻"类别已添加
   - "行业会议"类别已移除
   - 所有AI公司新闻自动标记为"manufacturer"类别

4. **自动部署**
   - GitHub集成正常
   - 每次推送自动触发Railway部署

### ⏸️ 已禁用的功能

**国内AI公司爬虫**（10家）
- 智谱AI
- 月之暗面（Moonshot）
- 百度AI
- 阿里云AI
- 字节跳动AI
- 商汤科技
- 旷视科技
- 第四范式
- 云从科技
- 科大讯飞

**禁用原因**：
1. Puppeteer需要大量内存和CPU资源，超出Railway免费/基础套餐限制
2. 中国网站的强反爬虫保护导致频繁超时
3. 动态内容提取返回0条结果
4. 会影响整体系统稳定性

**决策**：暂时专注于国际新闻翻译功能，确保核心功能稳定运行

## 🔧 翻译系统诊断

### 需要检查的关键点

#### 1. Railway环境变量
确保在Railway项目设置中配置了：
```
BUILT_IN_FORGE_API_KEY=sk-xxxxx
```
这是DeepSeek API密钥，**必须设置**才能使翻译功能工作。

#### 2. 检查部署日志
在Railway的Deployments页面查找：
- `[Server] Starting translation scheduler...`
- `[Translation] Starting translation process...`
- `[Translation] Found X news items to translate`
- `[Translation] Successfully translated news ID: X`

如果看不到这些日志，或者有错误信息，说明翻译系统有问题。

#### 3. 数据库状态
可以通过SQL查询检查翻译状态：
```sql
SELECT "translationStatus", COUNT(*) 
FROM "aiNews" 
WHERE region = 'international' 
GROUP BY "translationStatus";
```

预期结果：
- `translationStatus = 1`：待翻译
- `translationStatus = 2`：已翻译
- `translationStatus = 3`：翻译失败

### 翻译时间线
- 新闻抓取：每10分钟
- 翻译检查：每5分钟
- 单条翻译：2-3秒
- **总延迟**：新抓取的国际新闻可能需要5-15分钟才能看到中文翻译

## 📁 项目文件结构

### 核心文件
- `server/aiCompanyCrawlers.ts` - AI公司爬虫主文件
- `server/translationScheduler.ts` - 自动翻译调度器
- `server/_core/index.ts` - 服务器初始化和调度配置
- `server/_core/llm.ts` - DeepSeek API调用封装
- `server/_core/env.ts` - 环境变量配置

### 辅助文件
- `server/browserUtils.ts` - Puppeteer浏览器工具（已创建但未使用）
- `server/genericPuppeteerCrawler.ts` - 通用Puppeteer爬虫（已创建但未使用）
- `TRANSLATION_TROUBLESHOOTING.md` - 翻译系统故障排查指南
- `PROJECT_STATUS.md` - 本文件

### 测试文件
- `test-crawlers.ts` - 爬虫测试脚本
- `test-translation.ts` - 翻译功能测试脚本
- `check-translation-status.ts` - 数据库翻译状态检查脚本

## 🚀 部署信息

- **平台**：Railway
- **数据库**：PostgreSQL
- **自动部署**：GitHub main分支推送触发
- **爬虫频率**：每10分钟
- **翻译频率**：每5分钟

## 📝 最近的代码提交

1. **禁用国内爬虫** - 为了系统稳定性
2. **添加Puppeteer支持** - 为未来优化做准备（当前未使用）
3. **翻译系统故障排查指南** - 帮助诊断翻译问题
4. **项目状态报告** - 本文件

## 🎯 下一步建议

### 立即行动
1. **确认Railway环境变量**：检查 `BUILT_IN_FORGE_API_KEY` 是否正确设置
2. **查看部署日志**：确认翻译调度器是否正常启动
3. **验证翻译结果**：访问网站查看国际AI公司新闻是否已翻译成中文

### 短期优化（可选）
1. **增加翻译批次大小**：从20条增加到50条（如果API配额充足）
2. **减少翻译延迟**：从2秒减少到1秒（如果API速率限制允许）
3. **添加翻译重试机制**：对失败的翻译（status=3）自动重试

### 长期优化（可选）
1. **优化国内爬虫**：
   - 使用更轻量的方案（如API或RSS）
   - 只启用1-2个最重要的公司
   - 考虑使用第三方新闻聚合服务
2. **添加缓存机制**：减少重复翻译
3. **添加监控和告警**：翻译失败时发送通知

## 🐛 已知问题

1. **翻译可能不工作**
   - 原因：Railway环境变量可能未设置
   - 解决：按照故障排查指南检查

2. **国内AI公司新闻缺失**
   - 原因：爬虫已禁用
   - 状态：预期行为，暂时不修复

3. **Puppeteer相关文件未使用**
   - 原因：资源限制
   - 状态：保留以备将来使用

## 📞 技术支持

如果遇到问题，请提供：
1. Railway部署日志（特别是包含 `[Translation]` 的部分）
2. 数据库查询结果（translationStatus分布）
3. 环境变量配置截图（隐藏API密钥）

参考文档：
- `TRANSLATION_TROUBLESHOOTING.md` - 详细的故障排查步骤
- Railway Dashboard - 查看实时日志和环境变量

---

**最后更新**：2025年1月24日  
**版本**：v1.0（国内爬虫禁用版）
