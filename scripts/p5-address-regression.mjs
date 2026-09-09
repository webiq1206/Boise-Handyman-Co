import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch();await fs.mkdir('p5-address-results',{recursive:true});
const results=[];
try{
 for(const width of [320,768,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.route('**/api/property/enrich',r=>r.fulfill({contentType:'application/json',body:'{"profile":null}'}));
  await page.route('**/api/address/autocomplete?*',async route=>{
   const value=new URL(route.request().url()).searchParams.get('input');
   await new Promise(r=>setTimeout(r,value==='Second address'?50:800));
   await route.fulfill({contentType:'application/json',body:JSON.stringify({suggestions:[{placeId:value,description:value,mainText:value}]})}).catch(()=>{});
  });
  try{
   await page.goto('http://127.0.0.1:5000/p5-address-fixture',{waitUntil:'networkidle'});
   const input=page.getByTestId('input-address');
   await input.fill('First address');await page.waitForTimeout(400);
   await page.getByRole('button',{name:'Continue',exact:true}).click();await page.waitForTimeout(1100);
   if(await page.getByRole('listbox').isVisible())throw new Error('Late result reopened suggestions after blur');
   await input.fill('Dismissed address');await page.waitForTimeout(400);await input.press('Escape');await page.waitForTimeout(1100);
   if(await page.getByRole('listbox').isVisible())throw new Error('Late result reopened suggestions after Escape');
   await input.fill('Slow address');await page.waitForTimeout(400);await input.fill('Second address');await page.waitForTimeout(1400);
   if(await page.getByRole('option').first().innerText()!=='Second address')throw new Error('An old lookup overwrote the latest suggestions');
   await input.press('ArrowDown');await input.press('Enter');await page.waitForTimeout(100);
   if(await input.inputValue()!=='Second address')throw new Error('Keyboard selection did not preserve the selected address');
   await page.screenshot({path:`p5-address-results/${width}.png`,fullPage:true});
   results.push({width,ok:true,checks:['blur','Escape','out-of-order response','keyboard selection']});
  }catch(e){results.push({width,ok:false,error:String(e)});}
  await page.close();
 }
 for(const width of [320,390,430,768,1024,1440,1920]){
  const page=await browser.newPage({viewport:{width,height:900}});
  for(const slug of ['drywall-repair','carpentry-trim-repair/boise']){
   await page.goto('http://127.0.0.1:5000/services/'+slug,{waitUntil:'networkidle'});
   for(let y=0;y<await page.evaluate(()=>document.body.scrollHeight);y+=700){await page.evaluate(y=>window.scrollTo(0,y),y);await page.waitForTimeout(80);}
   await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(250);
   const aside=page.getByRole('complementary',{name:'In this guide'});
   const section=aside.locator('..');
   await section.screenshot({path:`p5-address-results/layout-${width}-${slug.replaceAll('/','_')}.png`});
   const bounds=await section.boundingBox();
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
   results.push({width,slug,test:'centered-guide-layout',ok:!overflow&&Math.abs(bounds.x+bounds.width/2-width/2)<2});
  }
  if(width<1024){
   await page.goto('http://127.0.0.1:5000/contact',{waitUntil:'networkidle'});
   await page.getByTestId('input-name').first().scrollIntoViewIfNeeded();await page.waitForTimeout(200);
   const hidden=!(await page.locator('[data-mobile-nav-bar]').isVisible());
   await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(200);
   const returns=await page.locator('[data-mobile-nav-bar]').isVisible();
   results.push({width,test:'mobile-bar-form-clearance',ok:hidden&&returns});
  }
  await page.close();
 }
}finally{await browser.close();await fs.writeFile('p5-address-results/results.json',JSON.stringify(results,null,2));}
console.log(JSON.stringify(results));if(results.some(x=>!x.ok))process.exitCode=1;
