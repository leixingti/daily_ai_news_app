-- 添加翻译字段到 ai_news 表
ALTER TABLE ai_news 
ADD COLUMN IF NOT EXISTS "titleZh" TEXT,
ADD COLUMN IF NOT EXISTS "summaryZh" TEXT,
ADD COLUMN IF NOT EXISTS "fullContentZh" TEXT;
