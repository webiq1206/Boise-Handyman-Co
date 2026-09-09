import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const site=process.env.AUDIT_SITE;
const base='https://'+site;
const parent=site==='p5homeco.com';
const widths=[320,390,430,768,1024,1440,1920];
const out='p5-interactions'; await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch(); const results=[];
const assert=(v,m)=>{if(!v)throw new Error(m)};
try {
 for(const width of widths){
  const context=await browser.newContext({viewport:{width,height:900},hasTouch:width<768});
  // No audit submissions, recovery emails or conversion hits leave this browser.
  let requests=[];let success=false;
  await context.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url());
   if(/google-analytics|analytics.google|googleadservices|facebook\.com\/tr|doubleclick/.test(url.href))return route.abort();
   if(url.pathname==='/api/address/autocomplete')return route.fulfill({contentType:'application/json',body:JSON.stringify({suggestions:[{placeId:'audit-address',description:'123 Main Street, Boise, ID 83702',mainText:'123 Main Street, Boise, ID 83702'}]})});
   if(url.pathname==='/api/property/enrich')return route.fulfill({contentType:'application/json',body:'{"profile":null}'});
   if(req.method()==='POST'&&url.pathname.startsWith('/api/')){
    requests.push({path:url.pathname,body:req.postDataJSON()});
    if(url.pathname==='/api/consultation'||url.pathname==='/api/leads/intake')return route.fulfill({status:success?(parent?201:200):503,contentType:'application/json',body:JSON.stringify(success?{success:true,accepted:true,duplicate:false,inquiryKey:"audit-inquiry",conversionId:"audit-conversion"}:{message:'Audit: service temporarily unavailable',error:'Audit: service temporarily unavailable'})});
    return route.fulfill({status:200,contentType:'application/json',body:'{"success":true}'});
   }
   return route.continue();
  });
  const page=await context.newPage();page.setDefaultTimeout(10000);
  try {
   await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForLoadState('networkidle');
   const menu=parent?page.getByRole('button',{name:'Open menu',exact:true}):page.getByTestId('button-mobile-menu-open');
   if(await menu.isVisible()){
    await menu.click();const dialog=page.getByRole('dialog').filter({visible:true}).first();await dialog.waitFor();
    await page.screenshot({path:`${out}/${width}-menu.jpg`,fullPage:true});
    await page.keyboard.press('Escape');await page.waitForTimeout(200);
    assert(!(await dialog.isVisible()),'Escape did not close navigation');
   }
   // Open each native FAQ without invoking links or communications.
   for(const el of await page.locator('main details > summary, .faq-item > summary').all()) {await el.click();assert(await el.evaluate(e=>e.parentElement.open),'FAQ failed to expand');await el.click();}
   results.push({width,test:'navigation-and-faq',ok:true});
  }catch(e){results.push({width,test:'navigation-and-faq',ok:false,error:String(e)});}
  try{
   await page.goto(base+(parent?'/quote':'/contact'),{waitUntil:'domcontentloaded'});await page.waitForLoadState('networkidle');
   const button=parent?page.getByRole('button',{name:'Request my free quote',exact:true}):page.getByTestId('button-submit-consultation').first();
   await button.click();await page.waitForTimeout(300);
   assert(!requests.some(x=>['/api/consultation','/api/leads/intake'].includes(x.path)),'Empty form submitted');
   await page.locator('[aria-invalid="true"]').first().waitFor();
   await page.screenshot({path:`${out}/${width}-validation.jpg`,fullPage:true});
   if(parent){await page.locator('input[name="name"]').fill('P5 browser audit');await page.locator('input[name="email"]').fill('audit@example.invalid');}
   else {
    await page.getByTestId('input-name').first().fill('P5 browser audit');
    for(const [id,value] of [['input-email','audit@example.invalid'],['input-phone','2085550199'],['input-address','123 Main Street, Boise, ID 83702']]){
     const field=page.getByTestId(id).first();if(await field.isVisible())await field.fill(value);
    }
    const address=page.getByTestId('input-address').first();if(await address.isVisible()){await address.focus();await page.waitForTimeout(450);await address.press('Escape');await address.press('Tab');}
    const project=page.getByTestId('select-project-type').first();if(await project.isVisible()){await project.click();await page.getByRole('option').first().click();}
   }
   await button.click();await page.waitForTimeout(600);
   assert(requests.some(x=>['/api/consultation','/api/leads/intake'].includes(x.path)),'Valid form did not reach mocked endpoint');
   assert(await page.getByText('Audit: service temporarily unavailable',{exact:false}).count()>0,'Server failure was not shown');
   assert(await button.isEnabled(),'Submit stayed disabled after error');
   const name=parent?page.locator('input[name="name"]'):page.getByTestId('input-name').first();
   assert(await name.inputValue()==='P5 browser audit','Entered name lost after server failure');
   await page.screenshot({path:`${out}/${width}-server-error.jpg`,fullPage:true});
   success=true;await button.click();await page.waitForTimeout(800);
   if(parent)await page.waitForURL('**/quote/thanks');
   else await page.getByTestId('consultation-success').waitFor({timeout:10000});
   await page.screenshot({path:`${out}/${width}-success.jpg`,fullPage:true});
   results.push({width,test:'validation-failure-retry-success',ok:true,mocked:true});
  }catch(e){await page.screenshot({path:`${out}/${width}-failure.jpg`,fullPage:true}).catch(()=>{});results.push({width,test:'validation-failure-retry-success',ok:false,error:String(e),mocked:true});}
  await context.close();await fs.writeFile(`${out}/results.json`,JSON.stringify(results,null,2));
 }
}finally{await browser.close();await fs.writeFile(`${out}/results.json`,JSON.stringify(results,null,2));}
console.log(JSON.stringify(results));if(results.some(r=>!r.ok))process.exitCode=1;
