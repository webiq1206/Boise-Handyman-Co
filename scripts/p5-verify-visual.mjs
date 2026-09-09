import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';

const sites = [
  { name: 'p5', base: 'https://p5homeco.com', routes: ['/', '/quote', '/sitemap'] },
  { name: 'construction', base: 'https://boiseconstruction.co', routes: ['/', '/services', '/about', '/contact', '/estimate'] },
  { name: 'remodeling', base: 'https://boiseremodeling.co', routes: ['/', '/services', '/about', '/contact', '/testimonials', '/estimate'] },
  { name: 'handyman', base: 'https://boisehandyman.co', routes: ['/', '/services', '/about', '/contact', '/estimate'] },
  { name: 'cabinet', base: 'https://boisecabinet.co', routes: ['/', '/services', '/about', '/contact', '/testimonials'] },
];
const widths = [320, 390, 430, 768, 1024, 1440, 1920];
const out = 'p5-verification';
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

async function auditSite(site) {
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 768 });
    const page = await context.newPage();
    for (const route of site.routes) {
      const pageErrors = [];
      const failedAssets = [];
      const onError = error => pageErrors.push(error.message);
      const onFailed = request => {
        if (['document', 'script', 'stylesheet', 'image', 'font'].includes(request.resourceType())) {
          failedAssets.push({ type: request.resourceType(), url: request.url(), error: request.failure()?.errorText });
        }
      };
      page.on('pageerror', onError);
      page.on('requestfailed', onFailed);
      const result = { site: site.name, width, route, ok: false, errors: [] };
      try {
        const response = await page.goto(site.base + route, { waitUntil: 'domcontentloaded', timeout: 120000 });
        if (!response || response.status() >= 400) throw new Error('HTTP ' + (response?.status() || 'no response'));
        await page.evaluate(async () => {
          for (let y = 0; y < document.documentElement.scrollHeight; y += 700) {
            window.scrollTo(0, y);
            await new Promise(resolve => setTimeout(resolve, 35));
          }
          document.querySelectorAll('.reveal-init').forEach(element => element.classList.add('reveal-visible'));
          const images = [...document.images].filter(image => image.getClientRects().length);
          for (const image of images) image.loading = 'eager';
          await Promise.race([
            Promise.allSettled(images.map(image => image.decode())),
            new Promise(resolve => setTimeout(resolve, 15000)),
          ]);
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(500);
        const state = await page.evaluate(() => {
          const visible = element => {
            if (!element) return false;
            const style = getComputedStyle(element);
            const box = element.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0;
          };
          const menu = document.querySelector('[data-testid="button-mobile-menu-open"]');
          const phone = document.querySelector('[data-testid="link-phone-desktop"]');
          const broken = [...document.images].filter(image => visible(image) && (!image.complete || !image.naturalWidth)).map(image => image.currentSrc || image.src);
          const fixedBottom = [...document.querySelectorAll('body *')].filter(element => {
            if (!visible(element)) return false;
            const style = getComputedStyle(element);
            const box = element.getBoundingClientRect();
            return style.position === 'fixed' && box.width > innerWidth * 0.75 && Math.abs(box.bottom - innerHeight) < 3;
          }).map(element => ({ background: getComputedStyle(element).backgroundColor, text: element.textContent.trim().slice(0, 80) }));
          return {
            title: document.title,
            viewport: innerWidth,
            scrollWidth: document.documentElement.scrollWidth,
            broken,
            menuVisible: visible(menu),
            phoneVisible: visible(phone),
            fixedBottom,
            text: document.body.innerText,
          };
        });
        if (state.scrollWidth > width + 1) result.errors.push('horizontal overflow ' + state.scrollWidth + '/' + width);
        if (state.broken.length) result.errors.push('broken images ' + JSON.stringify(state.broken));
        if (pageErrors.length) result.errors.push('page errors ' + JSON.stringify(pageErrors));
        if (failedAssets.length) result.errors.push('failed assets ' + JSON.stringify(failedAssets.slice(0, 5)));
        for (const bar of state.fixedBottom) {
          if (['rgba(0, 0, 0, 0)', 'transparent'].includes(bar.background)) result.errors.push('transparent bottom bar ' + bar.text);
        }
        if (route === '/' && site.name !== 'p5') {
          if (width === 1024 && !state.menuVisible) result.errors.push('1024px compact menu is not visible');
          if (width >= 1440 && state.menuVisible) result.errors.push(width + 'px compact menu should be hidden');
          if (width >= 1440 && !state.phoneVisible) result.errors.push(width + 'px desktop phone is not visible');
        }
        if (site.name === 'remodeling' && route === '/testimonials' && !/Design inspiration/i.test(state.text)) {
          result.errors.push('updated Design inspiration presentation is absent');
        }
        if (route === '/' && state.menuVisible) {
          const open = page.locator('[data-testid="button-mobile-menu-open"]');
          await open.click();
          const close = page.locator('[data-testid="button-mobile-menu-close"]');
          await close.waitFor({ state: 'visible' });
          const box = await close.boundingBox();
          if (!box || box.width < 44 || box.height < 44) result.errors.push('menu close target ' + box?.width + 'x' + box?.height);
          await close.click();
        }
        result.ok = result.errors.length === 0;
        result.summary = {
          title: state.title,
          scrollWidth: state.scrollWidth,
          brokenImages: state.broken.length,
          menuVisible: state.menuVisible,
          phoneVisible: state.phoneVisible,
          fixedBottom: state.fixedBottom,
        };
        if (route === '/' && [390, 1440].includes(width)) {
          await page.screenshot({ path: out + '/' + site.name + '-' + width + '-home.jpg', fullPage: true, type: 'jpeg', quality: 72 });
        }
        if (site.name === 'remodeling' && route === '/testimonials' && [390, 1440].includes(width)) {
          await page.screenshot({ path: out + '/remodeling-' + width + '-testimonials.jpg', fullPage: true, type: 'jpeg', quality: 72 });
        }
      } catch (error) {
        result.errors.push(String(error));
      } finally {
        results.push(result);
        page.off('pageerror', onError);
        page.off('requestfailed', onFailed);
      }
    }
    await context.close();
    await fs.writeFile(out + '/live-results.json', JSON.stringify(results, null, 2));
  }
}
await Promise.all(sites.map(auditSite));
await browser.close();
const failures = results.filter(result => !result.ok);
await fs.writeFile(out + '/live-results.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify({ checks: results.length, passed: results.length - failures.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
