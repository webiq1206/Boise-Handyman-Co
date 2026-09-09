import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const urls=["https://boiseconstruction.co/blog/category/treasure-valley-locations","https://boiseconstruction.co/services/energy-efficient-homes/caldwell","https://boiseconstruction.co/services/energy-efficient-homes/kuna","https://boiseconstruction.co/services/energy-efficient-homes/middleton","https://boiseconstruction.co/services/energy-efficient-homes/star","https://boiseconstruction.co/services/lot-evaluation/caldwell","https://boiseconstruction.co/services/lot-evaluation/kuna","https://boiseconstruction.co/services/lot-evaluation/middleton","https://boiseconstruction.co/services/lot-evaluation/star","https://boiseconstruction.co/services/shop-homes-barndominiums/boise","https://boisehandyman.co/blog/category/exterior-and-outdoor","https://boisehandyman.co/services/home-maintenance/caldwell","https://boisehandyman.co/services/home-maintenance/kuna","https://boisehandyman.co/services/home-maintenance/middleton","https://boisehandyman.co/services/home-maintenance/star","https://boisehandyman.co/services/mounting-assembly/caldwell","https://boisehandyman.co/services/mounting-assembly/kuna","https://boisehandyman.co/services/mounting-assembly/middleton","https://boisehandyman.co/services/mounting-assembly/star","https://boiseremodeling.co/blog/category/treasure-valley-locations","https://boiseremodeling.co/services/adu/caldwell","https://boiseremodeling.co/services/adu/kuna","https://boiseremodeling.co/services/adu/middleton","https://boiseremodeling.co/services/adu/star","https://boiseconstruction.co/","https://boiseconstruction.co/about","https://boiseremodeling.co/","https://boiseremodeling.co/about","https://boisehandyman.co/","https://boisehandyman.co/about"];
const width=Number(process.env.AUDIT_WIDTH);
const out='p5-triage';await mkdir(out,{recursive:true});
const browser=await chromium.launch();const context=await browser.newContext({viewport:{width,height:900},hasTouch:width<768});const results=[];
for(const url of urls){
 const page=await context.newPage();const r={url,width,errors:[],requests:[]};
 page.on('pageerror',e=>r.errors.push(e.message));page.on('response',e=>{if(e.status()>=400)r.requests.push({url:e.url(),status:e.status()})});
 try{
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});r.status=response.status();
  await page.evaluate(()=>Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,3000))]));
  const height=await page.evaluate(()=>document.documentElement.scrollHeight);
  for(let y=0;y<height;y+=700){await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);await page.waitForTimeout(70)}
  await page.evaluate(()=>{let images=[...document.images].filter(i=>i.getClientRects().length);images.forEach(i=>i.loading='eager');return Promise.race([Promise.allSettled(images.map(i=>i.decode())),new Promise(r=>setTimeout(r,15000))])});
  r.images=await page.evaluate(()=>[...document.images].map(i=>({src:i.currentSrc||i.src,alt:i.alt,rendered:!!i.getClientRects().length,complete:i.complete,width:i.naturalWidth})));
  r.overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
  r.broken=r.images.filter(i=>i.rendered&&(!i.complete||!i.width));
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(300);
  await page.screenshot({path:out+'/'+createHash('sha1').update(url).digest('hex').slice(0,12)+'.jpg',fullPage:true});
 }catch(e){r.error=e.message}finally{await page.close()}
 results.push(r);await writeFile(out+'/results.json',JSON.stringify(results));console.log(url,r.error||r.status,r.broken?.length);
}
await browser.close();
if(results.some(r=>r.error||r.errors.length||r.requests.length||r.overflow||r.broken?.length||r.status!==200))process.exitCode=1;
