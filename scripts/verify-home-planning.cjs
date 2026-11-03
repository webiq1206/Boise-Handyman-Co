/* Offline public-homepage-only QA. Never submits a form or loads an API. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const baseline=process.argv.includes('--baseline');
const phase=baseline?'before':'after';
const output=path.resolve('test-results/home-planning',phase);
fs.mkdirSync(output,{recursive:true});
const origin='http://127.0.0.1:34863';
const viewports=[[320,568],[360,640],[390,844],[430,932],[768,1024],[1024,768],[1280,720],[1440,900],[1920,1080],[844,390]];
const categories=['drywall-repair','painting-touch-ups','plumbing-repairs','electrical-repairs','mounting-assembly','carpentry-trim-repair'];
const failures=[],layoutFindings=[],records=[],blockedRequests=[];
const check=(ok,text)=>{if(!ok)failures.push(text)};
(async()=>{
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({serviceWorkers:'block',reducedMotion:'reduce'});
 await context.route('**/*',route=>{
  const request=route.request();const u=new URL(request.url());
  const asset=/\.(?:png|webp|jpe?g|svg|ico|woff2?|ttf|css|js|map)$/.test(u.pathname);
  const allowed=u.origin===origin&&request.method()==='GET'&&!u.pathname.startsWith('/api/')&&(u.pathname==='/'||u.pathname.startsWith('/_next/')||asset);
  if(!allowed)blockedRequests.push({method:request.method(),path:u.origin===origin?u.pathname:'external'});
  return allowed?route.continue():route.abort();
 });
 await context.routeWebSocket('**/*',socket=>socket.close());
 for(const [width,height] of viewports){
  const key=`${width}x${height}`;const page=await context.newPage();await page.setViewportSize({width,height});
  const record={viewport:key,states:[]};records.push(record);
  try {
   await page.goto(origin+'/',{waitUntil:'networkidle',timeout:180000});
   await page.evaluate(()=>document.fonts.ready);
   const section=page.getByTestId('handyman-planning-range');await section.waitFor();
   if(!baseline)await section.getByRole('link',{name:'Request a quote',exact:true}).waitFor();
   await page.screenshot({path:path.join(output,`first-${key}.png`)});
   async function capture(state,empty=false){
    await section.scrollIntoViewIfNeeded();
    const metrics=await section.evaluate(element=>{
     const b=element.getBoundingClientRect();
     const header=document.querySelector('[data-family-header]');
     const h=header?.getBoundingClientRect();
     const controls=[...element.querySelectorAll('button,a')].map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent,width:r.width,height:r.height}});
     return {sectionHeight:b.height,headerHeight:h?.height||0,viewportHeight:innerHeight,horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,controls};
    });
    const cta=section.getByTestId('proof-cta-contact');const count=await cta.count();
    record.states.push({state,empty,ctaCount:count,ctaText:count?await cta.innerText():null,range:await section.getByTestId('proof-range-value').count()?await section.getByTestId('proof-range-value').innerText():null,metrics});
    if(metrics.sectionHeight>height-metrics.headerHeight)layoutFindings.push(`${key} ${state}: existing input section exceeds viewport budget (${Math.round(metrics.sectionHeight)}px section; ${height-metrics.headerHeight}px before other occupied UI). Independent C10 review required.`);
    check(!metrics.horizontalOverflow,`${key} ${state}: horizontal overflow`);
    if(!baseline){
     check(count===1,`${key} ${state}: expected one persistent CTA`);
     if(count){check((await cta.innerText()).trim()==='Request a quote',`${key} ${state}: quote wording`);check(await cta.getAttribute('href')==='/#consult',`${key} ${state}: destination`);}
     check(await section.getByTestId('proof-range-value').count()===(empty?0:1),`${key} ${state}: range state`);
    }
    await section.screenshot({path:path.join(output,`${state}-${key}.png`)});
    if(state==='default'||empty)await page.screenshot({path:path.join(output,`${state}-viewport-${key}.png`)});
   }
   await capture('default');
   for(const category of categories){
    await section.getByTestId(`proof-category-${category}`).click();await capture(`${category}-empty`,true);
    const taskIds=await section.locator('[data-testid^="proof-task-"]').evaluateAll(items=>items.map(e=>e.dataset.testid));
    check(taskIds.length>0,`${key} ${category}: no tasks`);
    for(const id of taskIds){await section.getByTestId(id).click();await capture(id);}
   }
   if(!baseline){
    await section.getByTestId('proof-cta-contact').focus();
    await page.keyboard.press('Enter');
    check(new URL(page.url()).hash==='#consult',`${key}: keyboard quote destination`);
    check(await page.locator('#consult form').count()===1,`${key}: public request form target`);
    await page.screenshot({path:path.join(output,`quote-destination-${key}.png`)});
   }
  }catch(error){failures.push(`${key}: ${error.message}`)}finally{await page.close()}
 }
 await browser.close();
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({phase,records,failures,layoutFindings,blockedRequests,reviewStatus:'Rendered evidence requires independent visual review; test success alone is not release approval.'},null,2));
 console.log(JSON.stringify({phase,viewports:records.length,states:records.reduce((n,r)=>n+r.states.length,0),failures,layoutFindingCount:layoutFindings.length}));
 if(failures.length)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
