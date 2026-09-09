import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

// Initial connectivity and screenshot check. This is not the full route audit.
const sites = ['p5homeco.com', 'boiseconstruction.co', 'boiseremodeling.co', 'boisehandyman.co', 'boisecabinet.co'];
const widths = [1920, 1440, 1024, 768, 430, 390, 320];
const out = 'p5-visual-results';
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  for (const site of sites) {
    for (const width of widths) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
      const page = await context.newPage();
      const result = { site, width, errors: [], failedRequests: [] };
      page.on('pageerror', error => result.errors.push(error.message));
      page.on('requestfailed', request => result.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
      try {
        const response = await page.goto(`https://${site}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
        result.status = response?.status();
        result.url = page.url();
        const body = await page.locator('body').innerText();
        if (/verify you are human|checking your browser|automated traffic|security verification/i.test(body)) {
          result.blocked = true;
          await page.screenshot({ path: `${out}/${site}-${width}-blocked.png` });
          results.push(result);
          break;
        }
        await page.evaluate(() => document.fonts.ready);
        // Scroll through the real layout to trigger lazy images and reveal effects.
        for (let y = 0; y < Math.min(await page.evaluate(() => document.documentElement.scrollHeight), 30000); y += 700) {
          await page.evaluate(y => window.scrollTo(0, y), y);
          await page.waitForTimeout(100);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(500);
        result.layout = await page.evaluate(() => ({
          viewport: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight,
          brokenImages: [...document.images].filter(i => i.complete && !i.naturalWidth).map(i => ({ src: i.currentSrc || i.src, alt: i.alt })),
          links: [...new Set([...document.querySelectorAll('a[href]')].map(a => a.href))],
        }));
        await page.screenshot({ path: `${out}/${site}-${width}.png`, fullPage: true });
      } catch (error) {
        result.error = error.message;
      } finally {
        await context.close();
      }
      results.push(result);
      await writeFile(`${out}/results.json`, JSON.stringify(results, null, 2));
    }
  }
} finally {
  await browser.close();
  await writeFile(`${out}/results.json`, JSON.stringify(results, null, 2));
}
if (results.some(r => r.error || r.blocked || r.status >= 400)) process.exitCode = 1;
