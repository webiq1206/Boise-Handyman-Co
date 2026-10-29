import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.P5_TEST_BASE_URL||'http://127.0.0.1:5000';
const origin=new URL(base).origin;
const results=[];
await fs.mkdir('p5-verification',{recursive:true});
try {
 for(const [name,engine] of Object.entries({chromium,webkit})) {
  const browser=await engine.launch();
  try { for(const width of [390,1440]) {
   const entries=[['main','main a[href="/contact"]','contact-page'],['footer-estimate','footer a[href="/#consult"]','consult'],['footer-contact','footer a[href="/#consult"]','consult']];
   if(width===1440)entries.push(['header','header a[href="/#consult"]','consult']);
   for(const [entry,selector,target] of entries) {
    const context=await browser.newContext({viewport:{width,height:900}});
    await context.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin&&!u.pathname.startsWith('/api/')&&r.request().method()==='GET'?r.continue():r.abort('blockedbyclient');});
    const page=await context.newPage();page.setDefaultTimeout(30000);
    try {
     await page.goto(base+'/',{waitUntil:'networkidle'});
     const homeHeading=await page.locator('h1').innerText();
     const entryLink=page.locator(selector).first();
     if(entry==='footer-contact'){await entryLink.focus();await page.keyboard.press('Enter');}else await entryLink.click();
     const isContact=target==='contact-page';
     await page.waitForURL(u=>isContact?u.pathname==='/contact':u.pathname==='/'&&u.hash==='#'+target);
     const expectedHeading=isContact?await page.locator('h1').innerText():homeHeading;
     const actualTarget=isContact?'consult':target;
     if(isContact)await page.locator('#consult').scrollIntoViewIfNeeded();
     await page.waitForFunction(id=>{const r=document.getElementById(id)?.getBoundingClientRect();return r&&r.bottom>0&&r.top<innerHeight},actualTarget);
     assert.equal(await page.locator('#'+actualTarget).count(),1);
     if(width<1024)await page.getByRole('button',{name:'Open navigation menu',exact:true}).click();
     const services=page.locator((width<1024?'[data-testid="mobile-nav-drawer"]':'header')+' a[href="/services"]:visible').first();
     await services.click();await page.waitForURL(u=>u.pathname==='/services');
     await page.waitForFunction(()=>document.querySelector('h1')?.textContent?.includes('Everything we fix'));
     assert.equal(await page.locator('#calculator').count(),0);
     await page.goBack();await page.waitForURL(u=>isContact?u.pathname==='/contact':u.pathname==='/'&&u.hash==='#'+target);
     await page.waitForFunction(h=>document.querySelector('h1')?.innerText===h,expectedHeading);
     assert.equal(await page.locator('#'+actualTarget).count(),1,'Back must restore actual entry-page content, not only URL/scroll');
     await page.goForward();await page.waitForURL(u=>u.pathname==='/services');
     await page.waitForFunction(()=>document.querySelector('h1')?.textContent?.includes('Everything we fix'));
     assert.equal(await page.locator('#calculator').count(),0,'Forward must restore Services content');
     await page.goBack();await page.waitForFunction(h=>document.querySelector('h1')?.innerText===h,expectedHeading);
     assert.equal(await page.locator('#'+actualTarget).count(),1);
     results.push({browser:name,width,entry,passed:true});console.log(`${name} ${width} ${entry}: restored actual page content`);
    } finally {await context.close();}
   }
  }} finally {await browser.close();}
 }
} finally {await fs.writeFile('p5-verification/hash-history-results.json',JSON.stringify(results,null,2)+'\n');}
assert.equal(results.length,14);
console.log(JSON.stringify(results));
console.log('14 real route/content Back/Forward journeys passed; no submissions or external requests');
