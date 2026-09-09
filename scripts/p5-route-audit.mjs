import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const site = process.env.AUDIT_SITE;
const width = Number(process.env.AUDIT_WIDTH);
let urls = JSON.parse(await readFile('scripts/p5-audit-routes.json', 'utf8'))[site];
// Include public entry pages not present in the marketing sitemap.
if (site === 'p5homeco.com') urls = [...new Set([...urls, ...['/quote','/quote/handyman','/quote/kitchen-remodel','/quote/bathroom-remodel','/quote/custom-cabinets','/quote/custom-home','/quote/home-addition','/quote/adu'].map(p => `https://${site}${p}`)])];
if (!urls || !Number.isFinite(width)) throw new Error('AUDIT_SITE and AUDIT_WIDTH are required');
// Wait for the expected publication before collecting evidence.
const marker = {'boisehandyman.co':'hero-door-hinge-branded','boiseconstruction.co':'framing-in-progress-branded','boisecabinet.co':'hero-about-branded','boiseremodeling.co':'Design inspiration'}[site];
if (marker) {
 let deployed=false;
 for(let attempt=0;attempt<60;attempt++) {
  const html=await fetch('https://'+site+(site==='boisecabinet.co'?'/about':'/')).then(r=>r.text());
  if(html.toLowerCase().includes(marker.toLowerCase())) {deployed=true;break;}
  console.log('Waiting for published audit changes: '+site); await new Promise(r=>setTimeout(r,15000));
 }
 if(!deployed)throw new Error('Expected publication was not observed; refusing to certify old pages');
}
const out = 'p5-route-results';
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  for (const url of urls) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, hasTouch: width < 768 });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    const id = createHash('sha1').update(url).digest('hex').slice(0, 12);
    const result = { url, width, id, errors: [], requestFailures: [], sliders: [] };
    page.on('pageerror', e => result.errors.push(e.message));
    page.on('response', r => { if (r.status() >= 400) result.requestFailures.push({ url: r.url(), status: r.status() }); });
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
      result.status = response?.status();
      result.finalUrl = page.url();
      const body = await page.locator('body').innerText();
      if (/verify you are human|checking your browser|automated traffic|security verification/i.test(body)) {
        result.blocked = true;
        results.push(result);
        break;
      }
      await page.evaluate(() => Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 3000))]));
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < height; y += 720) {
        await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), y);
        await page.waitForTimeout(60);
      }
      await page.evaluate(async () => {
        const images = [...document.images].filter(i => i.getClientRects().length);
        images.forEach(i => { i.loading = 'eager'; });
        await Promise.race([Promise.allSettled(images.map(i => i.decode())), new Promise(r => setTimeout(r, 15000))]);
      });
      await page.waitForTimeout(200);
      const sliders = page.getByRole('slider');
      for (let i = 0; i < await sliders.count(); i++) {
        const slider = sliders.nth(i);
        if (!await slider.isVisible()) continue;
        const state = { label: await slider.getAttribute('aria-label') };
        await slider.press('Home');
        state.home = await slider.getAttribute('aria-valuenow');
        await slider.press('End');
        state.end = await slider.getAttribute('aria-valuenow');
        await slider.press('ArrowLeft');
        state.left = await slider.getAttribute('aria-valuenow');
        result.sliders.push(state);
      }
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForTimeout(100);
      result.dom = await page.evaluate(() => ({
        title: document.title,
        h1: [...document.querySelectorAll('h1')].map(e => e.textContent.trim()),
        scrollX, scrollY, width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
        images: [...document.images].map(i => ({ src: i.currentSrc || i.src, alt: i.alt, width: i.naturalWidth, complete: i.complete })),
        overflow: [...document.querySelectorAll('main *')].filter(e => { const r=e.getBoundingClientRect();const s=getComputedStyle(e);return r.width>0 && s.position!=='absolute' && s.position!=='fixed' && (r.right>innerWidth+2 || r.left < -2); }).slice(0,20).map(e => ({ tag:e.tagName, class:e.className, text:e.textContent.slice(0,100) })),
        hiddenReveals: [...document.querySelectorAll('.reveal-init')].filter(e => getComputedStyle(e).opacity==='0').length,
        forms: [...document.forms].map(f => ({action:f.action, fields:[...f.querySelectorAll('input,select,textarea')].map(e=>({tag:e.tagName,name:e.name,type:e.type,required:e.required,label:e.labels?.[0]?.textContent?.trim()}))})),
        buttons: [...document.querySelectorAll('button')].filter(e=>e.getClientRects().length).map(e=>({text:e.textContent.trim(),label:e.getAttribute('aria-label'),type:e.type})),
        links: [...new Set([...document.querySelectorAll('a[href]')].map(a => a.href))],
      }));
      await page.screenshot({ path: `${out}/${id}.jpg`, type: 'jpeg', quality: 70, fullPage: true });
    } catch (error) { result.error = error.message; }
    finally { await context.close(); }
    results.push(result);
    await writeFile(`${out}/results.json`, JSON.stringify(results));
    console.log(`${results.length}/${urls.length} ${width} ${url}: ${result.error || result.status}`);
  }
} finally {
  await browser.close();
  await writeFile(`${out}/results.json`, JSON.stringify(results));
}

if(results.some(r=>r.error||r.errors.length||r.requestFailures.length||r.status!==200||r.dom?.scrollWidth>width+1))process.exitCode=1;
