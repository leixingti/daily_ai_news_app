# Render 部署指南

本文档说明如何将 AI 每日新闻应用部署到 Render.com。

## 前置要求

1. **GitHub 账户** - 代码需要推送到 GitHub
2. **Render 账户** - 访问 https://render.com 并注册
3. **数据库** - 需要一个 MySQL/TiDB 数据库（可使用 Render 的数据库服务或外部数据库）

## 部署步骤

### 1. 准备 GitHub 仓库

首先，将项目代码推送到 GitHub：

```bash
# 初始化 git（如果还没有）
git init
git add .
git commit -m "Initial commit: AI Daily News App"

# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/daily_ai_news_app_v2.git
git branch -M main
git push -u origin main
```

### 2. 在 Render 上创建服务

1. 登录 Render 账户
2. 点击 **New +** > **Web Service**
3. 选择 **Connect a repository**
4. 授权 GitHub 并选择 `daily_ai_news_app_v2` 仓库
5. 配置服务设置：
   - **Name**: `daily-ai-news-app`
   - **Runtime**: `Node`
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start`
   - **Plan**: 选择合适的计划（Free/Paid）

### 3. 配置环境变量

在 Render 的 Environment 部分添加以下环境变量：

#### 必需的系统环境变量

```
NODE_ENV=production
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-secret-key
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=your-owner-id
OWNER_NAME=Your Name
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
```

#### 可选的 API 密钥（用于真实数据源）

```
IT_HOME_API_KEY=your-it-home-key
IT_HOME_API_URL=https://api.ithome.com
KR36_API_KEY=your-36kr-key
KR36_API_URL=https://api.36kr.com
NEURIPS_API_URL=https://neurips.cc/api
ICML_API_URL=https://icml.cc/api
CVPR_API_URL=https://cvpr2026.thecvf.com/api
AAAI_API_URL=https://aaai.org/api
ACL_API_URL=https://aclweb.org/api
```

### 4. 配置数据库

如果使用 Render 的数据库服务：

1. 在 Render 仪表板中创建一个新的 MySQL 数据库
2. 复制连接字符串到 `DATABASE_URL` 环境变量
3. 确保数据库支持 UTF-8 编码

如果使用外部数据库：

1. 获取数据库连接字符串
2. 在 `DATABASE_URL` 中配置连接字符串
3. 确保数据库可从 Render 访问

### 5. 部署

1. 在 Render 中点击 **Create Web Service**
2. 系统会自动从 GitHub 拉取代码并开始构建
3. 等待部署完成（通常需要 5-10 分钟）
4. 部署完成后，您将获得一个公开的 URL

### 6. 验证部署

部署完成后，访问您的应用 URL 并验证：

- ✅ 首页能正常加载
- ✅ 新闻列表显示正确
- ✅ AI 行业会议页面可访问
- ✅ 会议筛选和排序功能正常

## 常见问题

### Q: 部署失败，显示 "Build failed"

**A**: 检查以下几点：
1. 确保 `pnpm` 已安装（在 `package.json` 中指定了 `packageManager`）
2. 检查 `package.json` 中的依赖是否都能正确安装
3. 查看 Render 的构建日志了解具体错误

### Q: 数据库连接失败

**A**: 
1. 验证 `DATABASE_URL` 格式是否正确
2. 确保数据库服务器可从 Render 访问（检查防火墙规则）
3. 确保数据库用户有足够的权限

### Q: 爬虫不运行

**A**:
1. 检查服务器日志中是否有爬虫启动的日志
2. 确保环境变量正确配置
3. 如果使用了 API 密钥，确保它们有效

### Q: 如何更新应用

**A**: 只需将更新推送到 GitHub，Render 会自动检测到更改并重新部署。

## 性能优化建议

1. **使用付费计划** - Free 计划可能会因为不活动而休眠，建议使用 Starter 或更高计划
2. **配置 CDN** - 使用 Render 的 CDN 加速静态资源
3. **监控日志** - 定期检查 Render 的日志以发现潜在问题
4. **设置告警** - 配置 Render 的告警功能，在服务出现问题时通知您

## 更多帮助

- Render 官方文档: https://render.com/docs
- 项目 GitHub: https://github.com/YOUR_USERNAME/daily_ai_news_app_v2
- 问题报告: 在 GitHub Issues 中提交问题

---

**祝您部署顺利！** 🚀
