import puppeteer, { Browser, Page } from 'puppeteer';

let browser: Browser | null = null;

/**
 * Get or create a shared browser instance
 */
export async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.connected) {
    console.log('[Browser] Launching new browser instance...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
      ],
    });
    console.log('[Browser] Browser launched successfully');
  }
  return browser;
}

/**
 * Create a new page with common settings
 */
export async function createPage(): Promise<Page> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  // Set a realistic user agent
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );
  
  // Set viewport
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Set extra headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  });
  
  return page;
}

/**
 * Navigate to a URL with timeout and error handling
 */
export async function navigateToPage(page: Page, url: string, timeout = 30000): Promise<boolean> {
  try {
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout,
    });
    return true;
  } catch (error) {
    console.error(`[Browser] Failed to navigate to ${url}:`, error);
    return false;
  }
}

/**
 * Wait for a selector with timeout
 */
export async function waitForSelector(page: Page, selector: string, timeout = 10000): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    console.error(`[Browser] Selector not found: ${selector}`);
    return false;
  }
}

/**
 * Extract text content from elements
 */
export async function extractTextContent(page: Page, selector: string): Promise<string[]> {
  try {
    const elements = await page.$$(selector);
    const texts: string[] = [];
    
    for (const element of elements) {
      const text = await page.evaluate(el => el.textContent?.trim() || '', element);
      if (text) {
        texts.push(text);
      }
    }
    
    return texts;
  } catch (error) {
    console.error(`[Browser] Failed to extract text from ${selector}:`, error);
    return [];
  }
}

/**
 * Extract links from elements
 */
export async function extractLinks(page: Page, selector: string): Promise<string[]> {
  try {
    const elements = await page.$$(selector);
    const links: string[] = [];
    
    for (const element of elements) {
      const href = await page.evaluate(el => {
        if (el instanceof HTMLAnchorElement) {
          return el.href;
        }
        const anchor = el.querySelector('a');
        return anchor?.href || '';
      }, element);
      
      if (href) {
        links.push(href);
      }
    }
    
    return links;
  } catch (error) {
    console.error(`[Browser] Failed to extract links from ${selector}:`, error);
    return [];
  }
}

/**
 * Close browser instance
 */
export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
    console.log('[Browser] Browser closed');
  }
}

/**
 * Scroll page to load dynamic content
 */
export async function scrollToBottom(page: Page, maxScrolls = 3): Promise<void> {
  for (let i = 0; i < maxScrolls; i++) {
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(1000);
  }
}
