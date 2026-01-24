/**
 * Test translation functionality
 */

// Mock environment
process.env.BUILT_IN_FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY || 'test-key';

import { invokeLLM } from './server/_core/llm';

async function testTranslation() {
  console.log('=== Testing Translation Function ===\n');
  
  const mockNews = {
    id: 1,
    title: "OpenAI Announces GPT-5 with Revolutionary Capabilities",
    summary: "OpenAI has unveiled GPT-5, featuring advanced reasoning and multimodal understanding that surpasses previous models.",
    content: "In a groundbreaking announcement, OpenAI revealed GPT-5, marking a significant leap in artificial intelligence capabilities. The new model demonstrates unprecedented reasoning abilities and can seamlessly process text, images, and audio inputs.",
  };
  
  console.log('Mock news to translate:');
  console.log(`Title: ${mockNews.title}`);
  console.log(`Summary: ${mockNews.summary}\n`);
  
  try {
    console.log('Calling translation API...');
    
    const prompt = `请将以下英文AI新闻翻译成中文，保持专业性和准确性。只返回翻译后的内容，不要添加任何解释。

标题：${mockNews.title}

摘要：${mockNews.summary}

内容：${mockNews.content}

请按以下JSON格式返回翻译结果：
{
  "title": "翻译后的标题",
  "summary": "翻译后的摘要",
  "content": "翻译后的内容"
}`;

    const result = await invokeLLM({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      responseFormat: { type: "json_object" },
    });
    
    console.log('API call successful!');
    console.log('Response:', JSON.stringify(result, null, 2));
    
    const translatedText = result.choices[0]?.message?.content;
    if (translatedText && typeof translatedText === 'string') {
      const translated = JSON.parse(translatedText);
      console.log('\n=== Translated Content ===');
      console.log(`Title: ${translated.title}`);
      console.log(`Summary: ${translated.summary}`);
      console.log(`Content: ${translated.content}`);
    } else {
      console.error('Invalid translation result format');
    }
    
  } catch (error) {
    console.error('Translation test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
  
  process.exit(0);
}

testTranslation();
