/**
 * Test script for Puppeteer-based crawlers
 */

import { crawlZhipuAI, crawlMoonshot, crawlBaiduAI } from './server/aiCompanyCrawlers';

async function testCrawlers() {
  console.log('=== Testing Puppeteer Crawlers ===\n');
  
  try {
    console.log('Testing 智谱AI crawler...');
    await crawlZhipuAI();
    console.log('✓ 智谱AI crawler completed\n');
  } catch (error) {
    console.error('✗ 智谱AI crawler failed:', error);
  }
  
  try {
    console.log('Testing 月之暗面 crawler...');
    await crawlMoonshot();
    console.log('✓ 月之暗面 crawler completed\n');
  } catch (error) {
    console.error('✗ 月之暗面 crawler failed:', error);
  }
  
  try {
    console.log('Testing 百度AI crawler...');
    await crawlBaiduAI();
    console.log('✓ 百度AI crawler completed\n');
  } catch (error) {
    console.error('✗ 百度AI crawler failed:', error);
  }
  
  console.log('=== Test completed ===');
  process.exit(0);
}

testCrawlers();
