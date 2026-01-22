-- 添加 source 字段到 ai_news 表
ALTER TABLE ai_news ADD COLUMN IF NOT EXISTS source VARCHAR(100);

-- 为现有数据填充 source 字段（从 sourceUrl 推断）
UPDATE ai_news 
SET source = CASE
  WHEN sourceUrl LIKE '%jiqizhixin.com%' THEN '机器之心'
  WHEN sourceUrl LIKE '%qbitai.com%' THEN '量子位'
  WHEN sourceUrl LIKE '%36kr.com%' THEN '36Kr'
  WHEN sourceUrl LIKE '%technologyreview.com%' THEN 'MIT Technology Review'
  WHEN sourceUrl LIKE '%arxiv.org%' THEN 'ArXiv AI'
  WHEN sourceUrl LIKE '%openai.com%' THEN 'OpenAI Blog'
  WHEN sourceUrl LIKE '%deepmind.google%' THEN 'DeepMind Blog'
  WHEN sourceUrl LIKE '%techcrunch.com%' THEN 'TechCrunch'
  WHEN sourceUrl LIKE '%ithome.com%' THEN 'IT之家'
  WHEN sourceUrl LIKE '%ifanr.com%' THEN '爱范儿'
  ELSE 'Unknown'
END
WHERE source IS NULL;
