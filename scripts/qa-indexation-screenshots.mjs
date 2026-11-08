/**
 * 360px screenshots of the production server.
 *
 *   node scripts/qa-indexation-screenshots.mjs http://127.0.0.1:5000 qa/handyman-152
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const origin = (process.argv[2] ?? 'http://127.0.0.1:5000').replace(/\/$/, '');
const outDir = process.argv[3] ?? 'qa/handyman-152';
const shots = [
  { name: 'home-360', path: '/' },
  { name: 'services-360', path: '/services' },
  { name: 'service-related-360', path: '/services/drywall-repair', heading: 'Related services' },
  { name: 're10-360', path: '/re-10-repairs-boise' },
];

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 1 });
for (const shot of shots) {
  await page.goto(`${origin}${shot.path}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${outDir}/${shot.name}-full.png`, fullPage: true });
  if (shot.heading) {
    const heading = page.getByRole('heading', { name: shot.heading, exact: true });
    await heading.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'nearest' }));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${outDir}/${shot.name}-viewport.png` });
  }
}
await browser.close();
console.log(`wrote ${shots.length} page captures to ${outDir}`);
