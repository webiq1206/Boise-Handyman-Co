import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch();const results=[];await fs.mkdir('p5-interactions',{recursive:true});
for(const width of [320,390,430,768,1024,1440,1920]){
 const page=await browser.newPage({viewport:{width,height:900},hasTouch:width<768});let errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('https://boisecabinet.co/catalog',{waitUntil:'domcontentloaded'});
  const input=page.getByRole('spinbutton',{name:'Go to page',exact:true});await input.waitFor({timeout:60000});
  await input.fill('3');await page.waitForTimeout(1200);
  await page.getByRole('button',{name:'Next page',exact:true}).click();await page.waitForTimeout(1200);
  if(Number(await input.inputValue())<=3)throw new Error('Next page did not advance');
  await page.getByRole('button',{name:'Zoom in',exact:true}).click();
  await page.getByRole('button',{name:'Page thumbnails',exact:true}).click();
  await page.getByRole('button',{name:'Search the catalog',exact:true}).click();
  await page.getByPlaceholder('Search the catalog (e.g. shaker, walnut, hardware)…').fill('shaker');
  
  const search=page.getByPlaceholder('Search the catalog (e.g. shaker, walnut, hardware)…');
  await search.press('Enter');
  const found=page.getByText(/^Found on page [0-9]+$/).filter({visible:true});
  await found.waitFor({timeout:90000});
  const matched=Number((await found.innerText()).match(/[0-9]+/)[0]);
  await page.waitForTimeout(500);
  const landed=Number(await input.inputValue());
  if(Math.abs(matched-landed)>1)throw new Error('Search did not navigate to matching page');
  await search.scrollIntoViewIfNeeded();
  await page.screenshot({path:`p5-interactions/search-found-${width}.jpg`});
  const geometry=await search.evaluate(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,width:innerWidth}});
  if(geometry.left<0||geometry.right>geometry.width)throw new Error('Search field outside viewport '+JSON.stringify(geometry));
  await search.fill('p5auditnomatchzzzz');
  await search.press('Enter');
  await page.getByText('No matches for “p5auditnomatchzzzz”',{exact:true}).filter({visible:true}).waitFor({timeout:90000});
  await page.screenshot({path:`p5-interactions/search-empty-${width}.jpg`});
  await page.getByRole('button',{name:'Close search',exact:true}).click();
  await page.getByRole('button',{name:'Scroll',exact:true}).click();
  await page.waitForTimeout(1500);await input.scrollIntoViewIfNeeded();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
  results.push({width,ok:!overflow&&!errors.length,errors,checks:['PDF ready','page navigation','zoom','thumbnails','search panel','matching search navigation','no-match feedback','search field geometry','scroll mode']});
 }catch(e){results.push({width,ok:false,error:String(e),errors});}
 await page.screenshot({path:`p5-interactions/catalog-${width}.jpg`,fullPage:true});await page.close();await fs.writeFile('p5-interactions/catalog-results.json',JSON.stringify(results,null,2));
}
await browser.close();console.log(JSON.stringify(results));if(results.some(r=>!r.ok))process.exitCode=1;
