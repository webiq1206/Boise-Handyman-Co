#!/usr/bin/env node
/* Loopback-only public-calculator acceptance. No form submissions or API calls. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const {chromium} = require('playwright');

const STORAGE_KEY = 'handyman-home-planning-v1';
const MATRIX = [[320,568],[360,640],[390,844],[430,932],[768,1024],[1024,768],[1280,720],[1440,900],[1920,1080],[844,390]];
const SCOPE = {
  'drywall-repair':['drywall-small-patch','drywall-large-patch','drywall-ceiling-patch','drywall-texture-match'],
  'painting-touch-ups':['paint-room-touch-up','paint-accent-wall','paint-door-trim','paint-exterior-spot'],
  'plumbing-repairs':['plumbing-faucet-swap','plumbing-toilet-repair','plumbing-toilet-replace','plumbing-disposal-swap'],
  'electrical-repairs':['electrical-outlet-switch','electrical-light-fixture','electrical-ceiling-fan','electrical-smoke-detector'],
  'mounting-assembly':['mount-tv','mount-shelves','assemble-furniture','mount-curtain-rods'],
  'carpentry-trim-repair':['carpentry-door-adjust','carpentry-trim-repair','carpentry-cabinet-repair','carpentry-window-repair'],
};
const PRIVATE = /DEFAULT_FINANCE|UNCONFIGURED_FINANCE|SERVICE_MATRIX|annualOverhead|annualRevenue|minimumDirect|minimumCode|rushRate|emergencyRate|bookCode|targetOperatingProfit|riskAdjustedDirectCost/;
const args = process.argv.slice(2);
function arg(name, fallback) {const n=args.indexOf(name);return n<0?fallback:args[n+1];}
function requireThat(value, message) {if(!value)throw new Error(message);}
if(args.includes('--help')) {
  console.log('Usage: node scripts/verify-handyman-planning-browser.cjs --expected /absolute/public-planning.json [--base-url http://127.0.0.1:34863] [--output test-results/handyman-planning-browser] [--viewports 320x568,390x844]');
  process.exit(0);
}
const base = new URL(arg('--base-url',process.env.HANDYMAN_PLANNING_BASE_URL||'http://127.0.0.1:34863'));
const host = base.hostname.replace(/^\[|\]$/g,'');
requireThat((host==='localhost'||host==='::1'||(net.isIP(host)===4&&host.startsWith('127.')))&&['http:','https:'].includes(base.protocol)&&!base.username&&!base.password&&base.pathname==='/', 'Base URL must be a loopback HTTP(S) root without credentials');
const expectedPath = arg('--expected',process.env.HANDYMAN_PLANNING_EXPECTED);
requireThat(expectedPath&&fs.existsSync(expectedPath),'Provide --expected with the server-generated public-only JSON fixture');
const expectedBytes=fs.readFileSync(expectedPath);
requireThat(expectedBytes.length<250000,'Public fixture is unexpectedly large');
const expected=JSON.parse(expectedBytes.toString('utf8'));
function keys(value, allowed, required, label) {
  requireThat(value&&typeof value==='object'&&!Array.isArray(value),`${label}: expected a plain object`);
  const actual=Object.keys(value);
  requireThat(actual.every(key=>allowed.includes(key))&&required.every(key=>actual.includes(key)),`${label}: unexpected or missing public field`);
}
keys(expected,['version','categories'],['version','categories'],'fixture');
requireThat(expected.version===1&&Array.isArray(expected.categories),'Unsupported public fixture');
requireThat(JSON.stringify(expected.categories.map(c=>c.id))===JSON.stringify(Object.keys(SCOPE)),'Fixture must cover the six approved homepage categories');
for(const category of expected.categories) {
  keys(category,['id','label','description','tasks'],['id','label','tasks'],category.id);
  requireThat(typeof category.label==='string'&&Array.isArray(category.tasks),'Invalid category display data');
  requireThat(JSON.stringify(category.tasks.map(t=>t.id))===JSON.stringify(SCOPE[category.id]),`${category.id}: fixture must retain all four approved choices`);
  for(const task of category.tasks) {
    keys(task,['id','label','description','range'],['id','label','range'],task.id);
    requireThat(typeof task.label==='string'&&(!('description' in task)||typeof task.description==='string'),'Invalid task display data');
    if(task.range!==null) {
      keys(task.range,['low','high'],['low','high'],`${task.id} range`);
      requireThat(Number.isFinite(task.range.low)&&task.range.low>0&&Number.isFinite(task.range.high)&&task.range.high>=task.range.low,'Invalid public range');
    }
  }
}
requireThat(!PRIVATE.test(expectedBytes.toString('utf8')),'Fixture contains private finance fields');
const requested=arg('--viewports','');
const viewports=requested?requested.split(',').map(v=>v.split('x').map(Number)):MATRIX;
requireThat(viewports.every(v=>v.length===2&&v.every(n=>Number.isInteger(n)&&n>=200&&n<=4000)),'Invalid viewport list');
const out=path.resolve(arg('--output',process.env.HANDYMAN_PLANNING_OUTPUT||'test-results/handyman-planning-browser'));
for(const dir of ['','screenshots','html'])fs.mkdirSync(path.join(out,dir),{recursive:true});
const failures=[],records=[],requests=[],journeys=[],consoleErrors=[],captures=[];
const check=(ok,message,context={})=>{if(!ok)failures.push({message,...context});return ok;};
const clean=text=>String(text||'').replace(/\s+/g,' ').trim();
const currency=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
const rangeText=range=>range.low===range.high?currency.format(range.low):`${currency.format(range.low)} to ${currency.format(range.high)}`;
const git=args=>{try{return execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{return '';}};
const identity={commit:git(['rev-parse','HEAD']),tree:git(['rev-parse','HEAD^{tree}']),branch:git(['branch','--show-current']),dirty:Boolean(git(['status','--porcelain']))};
let browser;

async function contextFor(viewport, mode='normal', reducedMotion='reduce') {
  const context=await browser.newContext({viewport,serviceWorkers:'block',reducedMotion});
  const meta={viewport:`${viewport.width}x${viewport.height}`,mode,phase:'bootstrap'};
  await context.addInitScript(({key,blocked})=>{
    window.__handymanAcceptanceSubmits=0;
    // Snapshot origin at the fetch call, not at route interception. A delayed
    // consultation tracker must not become a planner request merely because
    // the user started choosing tasks before its timer fired.
    let origin='baseline';
    let action={sequence:0,id:'',at:0};
    const originalMicrotask=window.queueMicrotask.bind(window);
    for(const eventName of ['pointerdown','click','keydown','input','change'])document.addEventListener(eventName,event=>{
      const element=event.target instanceof Element?event.target:null;
      const planner=element?.closest('[data-testid="proof-step-panel"]');
      if(!planner)return;
      origin='planner-event';
      action={sequence:action.sequence+1,id:element.closest('[data-testid]')?.getAttribute('data-testid')||eventName,at:Date.now()};
      originalMicrotask(()=>{origin='baseline';});
    },true);
    for(const name of ['setTimeout','setInterval','requestAnimationFrame','queueMicrotask']){
      const original=window[name].bind(window);
      window[name]=function(callback,...values){
        const source=origin;
        const wrapped=typeof callback==='function'?function(...callbackValues){const previous=origin;origin=source==='baseline'?'baseline':'planner-async';try{return callback.apply(this,callbackValues);}finally{origin=previous;}}:callback;
        return original(wrapped,...values);
      };
    }
    const originalFetch=window.fetch;
    window.fetch=function(input,init){
      const url=new URL(typeof input==='string'||input instanceof URL?input:input.url,location.href);
      const method=(init?.method||(input instanceof Request?input.method:'GET')).toUpperCase();
      if(url.origin===location.origin&&(method!=='GET'||url.pathname.startsWith('/api/'))){
        const headers=new Headers(init?.headers||(input instanceof Request?input.headers:undefined));
        const stack=String(new Error('Acceptance request origin').stack||'').slice(0,5000);
        headers.set('x-handyman-acceptance-origin',JSON.stringify({origin,action:{...action},stack,calledAt:Date.now()}));
        return originalFetch.call(this,input,{...init,headers});
      }
      return originalFetch.call(this,input,init);
    };
    document.addEventListener('submit',event=>{window.__handymanAcceptanceSubmits++;event.preventDefault();event.stopImmediatePropagation();},true);
    if(blocked) {
      for(const method of ['getItem','setItem','removeItem']) {
        const original=Storage.prototype[method];
        Storage.prototype[method]=function(name,...values){if(name===key)throw new DOMException('Synthetic planning storage denial','SecurityError');return original.call(this,name,...values);};
      }
    }
  },{key:STORAGE_KEY,blocked:mode==='storage-blocked'});
  await context.route('**/*',route=>{
    const request=route.request(),url=new URL(request.url());
    const local=url.origin===base.origin;
    const asset=/\.(?:png|webp|jpe?g|svg|ico|woff2?|ttf|css|js|map)$/.test(url.pathname);
    const proxied=url.pathname==='/_next/image'&&/^(?:https?:)?\/\//i.test(url.searchParams.get('url')||'');
    const allowed=local&&request.method()==='GET'&&!url.pathname.startsWith('/api/')&&!proxied&&(url.pathname==='/'||url.pathname.startsWith('/_next/')||asset);
    const body=request.postData();
    let trace=null,payload=null;
    try{trace=JSON.parse(request.headers()['x-handyman-acceptance-origin']);}catch{}
    try{payload=JSON.parse(body||'null');}catch{}
    const planner=trace?.origin?.startsWith('planner')||/HandymanPlanningRange|handymanPlanning/i.test(trace?.stack||'');
    const existingTracker=local&&url.pathname==='/api/estimator-session'&&payload?.flow==='consultation'&&!planner;
    const devtool=local&&['/__nextjs_original-stack-frames','/__nextjs_original-stack-frame'].includes(url.pathname)&&!planner;
    const attribution=planner?'planner':existingTracker?'existing-consultation-tracker':devtool?'next-development-tool':meta.phase==='bootstrap'?'bootstrap':'unattributed';
    requests.push({...meta,method:request.method(),url:request.url(),type:request.resourceType(),decision:allowed?'allow':'block',attribution,originTrace:trace,bodyBytes:body?Buffer.byteLength(body):0,trackerFlow:existingTracker?payload.flow:undefined});
    const unsafe=url.pathname.startsWith('/api/')||request.method()!=='GET';
    if(unsafe&&(planner||(meta.phase==='calculator'&&!existingTracker&&!devtool)))check(false,'Planner or unattributed active journey attempted an API or non-GET request',{...meta,url:request.url(),method:request.method(),attribution,originTrace:trace});
    return allowed?route.continue():route.abort();
  });
  await context.routeWebSocket('**/*',socket=>{requests.push({...meta,type:'websocket',url:socket.url(),decision:'block'});socket.close();});
  const page=await context.newPage();
  page.on('pageerror',error=>consoleErrors.push({...meta,message:error.message}));
  return {context,page,meta};
}
async function settle(page) {
  await page.evaluate(()=>new Promise(resolve=>{
    let last=window.scrollY,stable=0,frames=0;
    const tick=()=>{const y=window.scrollY;stable=Math.abs(y-last)<.5?stable+1:0;last=y;if(stable>=4||++frames>75)resolve();else requestAnimationFrame(tick);};
    requestAnimationFrame(tick);
  }));
}
async function openPage(page,meta,saveHtml=false) {
  const response=await page.goto(base.href,{waitUntil:'networkidle',timeout:180000});
  requireThat(response&&response.ok(),'Public preview did not return a successful response');
  if(saveHtml) {
    const html=await response.text();fs.writeFileSync(path.join(out,'html',`${meta.viewport}-${meta.mode}-response.html`),html);
    check(!PRIVATE.test(html),'Public HTML/Flight response contains private finance canaries',meta);
  }
  await ready(page);
  await page.evaluate(()=>document.fonts.ready);
  await page.getByTestId('proof-step-panel').evaluate(element=>{
    const h=document.querySelector('[data-family-header]')?.getBoundingClientRect().height||0;
    window.scrollTo({top:Math.max(0,element.getBoundingClientRect().top+window.scrollY-h-12),behavior:'instant'});
  });
  await settle(page);meta.phase='calculator';
}
async function step(page) {return page.getByTestId('proof-step-panel').getAttribute('data-step');}
async function ready(page) {
  await page.locator('[data-testid="proof-step-panel"][data-ready="true"]').waitFor({state:'visible',timeout:30000});
}
async function expectStep(page,wanted,context={}) {
  await page.waitForFunction(value=>{const panel=document.querySelector('[data-testid="proof-step-panel"]');return panel?.getAttribute('data-ready')==='true'&&panel.getAttribute('data-step')===value;},wanted,{timeout:10000});
  await settle(page);
  check(await step(page)===wanted,`Expected ${wanted} step`,context);
}
async function clickStep(page,id,wanted,context={}) {
  await page.getByTestId(id).click();await expectStep(page,wanted,context);
  const focus=await page.evaluate(()=>document.activeElement?.hasAttribute('data-step-first'));
  check(focus,'New step did not focus its first control',{...context,step:wanted});
}
async function categoryStep(page,context={}) {
  for(let n=0;n<4;n++) {
    const current=await step(page);
    if(current==='category')return;
    if(current==='result')await clickStep(page,'proof-back','review',context);
    else if(current==='review')await clickStep(page,'proof-edit-category','category',context);
    else if(current==='task')await clickStep(page,'proof-back','category',context);
    else throw new Error(`Unknown planning step: ${current}`);
  }
  throw new Error('Could not reach category step');
}
async function geometry(page,meta,label,shot=false) {
  const facts=await page.getByTestId('proof-step-panel').evaluate(panel=>{
    const box=element=>{const r=element.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height};};
    const visible=element=>{const s=getComputedStyle(element),r=element.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;};
    const vv=window.visualViewport;
    const viewport={width:innerWidth,height:innerHeight,clientWidth:document.documentElement.clientWidth,visualWidth:vv?.width||innerWidth,visualHeight:vv?.height||innerHeight,offsetTop:vv?.offsetTop||0,offsetLeft:vv?.offsetLeft||0,scale:vv?.scale||1};
    const header=document.querySelector('[data-family-header]'),nav=panel.querySelector('nav'),body=panel.querySelector(':scope > div');
    const safe=document.createElement('div');safe.style.cssText='position:fixed;visibility:hidden;height:100svh;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);pointer-events:none';document.body.append(safe);
    const safeStyle=getComputedStyle(safe);const svh=parseFloat(safeStyle.height)||safe.getBoundingClientRect().height;const safeArea={top:parseFloat(safeStyle.paddingTop)||0,bottom:parseFloat(safeStyle.paddingBottom)||0};safe.remove();
    const controls=[...panel.querySelectorAll('button,a')].filter(visible).map(element=>{
      const r=box(element),style=getComputedStyle(element),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
      return {...r,text:element.textContent,testId:element.getAttribute('data-testid'),role:element.getAttribute('role'),disabled:Boolean(element.disabled),fontSize:parseFloat(style.fontSize),covered:!!hit&&!element.contains(hit)};
    });
    const clipped=[panel,...panel.querySelectorAll('*')].filter(element=>element instanceof HTMLElement&&visible(element)).filter(element=>{const s=getComputedStyle(element);return (/auto|scroll|hidden|clip/.test(s.overflowY)&&element.clientHeight>0&&element.scrollHeight>element.clientHeight+1)||(/auto|scroll|hidden|clip/.test(s.overflowX)&&element.clientWidth>0&&element.scrollWidth>element.clientWidth+1);}).map(element=>({tag:element.tagName,testId:element.getAttribute('data-testid'),overflow:getComputedStyle(element).overflow,scrollHeight:element.scrollHeight,clientHeight:element.clientHeight}));
    const promo=document.querySelector('[data-family-bar]');
    return {step:panel.getAttribute('data-step'),textEntryCount:panel.querySelectorAll('input:not([type=hidden]),textarea,select,[contenteditable="true"]').length,viewport,smallViewportHeight:svh,safeArea,panel:box(panel),body:body?box(body):null,header:header&&visible(header)?box(header):null,nav:nav?{...box(nav),position:getComputedStyle(nav).position,paddingBottom:getComputedStyle(nav).paddingBottom}:null,controls,clipped,horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,promoState:promo?.getAttribute('data-state')||'absent',heading:{text:panel.querySelector('h3')?.innerText,color:panel.querySelector('h3')?getComputedStyle(panel.querySelector('h3')).color:null},progress:panel.querySelector('[data-testid="proof-progress"]')?.innerText||'',animation:body?{name:getComputedStyle(body).animationName,duration:getComputedStyle(body).animationDuration}:null};
  });
  const context={...meta,label,step:facts.step};
  records.push({...context,...facts});
  const top=Math.max(facts.viewport.offsetTop,facts.header?.bottom||0),bottom=facts.viewport.offsetTop+facts.viewport.visualHeight;
  const contentBottom=facts.nav?.position==='fixed'?Math.min(bottom,facts.nav.top):bottom;
  check(!facts.horizontalOverflow,'Horizontal page overflow',context);
  check(facts.textEntryCount===0,'A text-entry control requires actual keyboard coverage; this fixed-choice driver cannot certify it',context);
  check(!facts.clipped.length,'Step contains an inner scrolling or clipping container',{...context,clipped:facts.clipped});
  if(facts.body){check(facts.body.top>=top-1,'Step content starts behind the header',context);check(facts.body.bottom<=contentBottom+1,'Active content extends below its visible budget',{...context,bodyBottom:facts.body.bottom,budgetBottom:contentBottom});}
  check(/Step\s+[1-4]\s+of\s+4/.test(`${facts.progress} ${facts.heading.text}`),'Current and total progress is missing',context);
  check(facts.promoState!=='visible','Promotional mobile bar competes with task navigation',context);
  if(facts.nav)check(facts.nav.top>=top-1&&facts.nav.bottom<=bottom+1,'Task navigation is outside the visible viewport',context);
  for(const control of facts.controls) {
    const inNav=control.testId==='proof-back'||control.testId==='proof-next'||control.testId==='proof-cta-contact';
    check(control.top>=top-1&&control.bottom<=(inNav?bottom:contentBottom)+1,`Control is clipped or obstructed: ${control.testId}`,context);
    check(!control.covered,`Control is covered: ${control.testId}`,context);
    check(control.width>=43.5&&control.height>=43.5,`Touch target is under44px: ${control.testId}`,context);
    if(control.role==='radio')check(control.height>=55.5,`Choice card is under56px: ${control.testId}`,context);
    if(control.testId==='proof-next'||control.testId==='proof-cta-contact')check(control.height>=47.5,`Primary action is under48px: ${control.testId}`,context);
  }
  if(meta.reducedMotion!=='no-preference'&&facts.animation)check(facts.animation.name==='none'||facts.animation.duration.split(',').every(value=>parseFloat(value)===0),'Reduced motion still animates step content',context);
  if(shot){const name=`${meta.viewport}-${meta.mode}-${label}.png`;await page.screenshot({path:path.join(out,'screenshots',name),animations:'disabled'});captures.push(name);}
  return facts;
}
async function assertResult(page,task,meta) {
  const amount=page.getByTestId('proof-range-value');
  if(task.range===null){check(await amount.count()===0,'Unpriced task fabricated a range',{...meta,task:task.id});check(clean(await page.getByTestId('proof-unpriced').innerText())==='This task needs a closer look. Send the list for a written price.','Unpriced recovery copy changed',{...meta,task:task.id});}
  else check(clean(await amount.innerText())===rangeText(task.range),'Customer range changed',{...meta,task:task.id,expected:rangeText(task.range),actual:clean(await amount.innerText())});
  check(await page.getByTestId('proof-cta-contact').getAttribute('href')==='/#consult','Quote destination changed',meta);
  if(task.description)check(clean(await page.getByTestId('proof-result-description').innerText())===clean(task.description),'Result lost its scope qualifier',{...meta,task:task.id});
}
async function allTasks(page,meta) {
  await geometry(page,meta,'initial-result',true);
  for(const [categoryIndex,category]of expected.categories.entries()) {
    await categoryStep(page,meta);
    check(await page.getByTestId('proof-step-panel').getByRole('radio').count()===6,'Category choice count changed',meta);
    await page.getByTestId(`proof-category-${category.id}`).click();await settle(page);
    await geometry(page,meta,`${category.id}-category`,categoryIndex===0);
    await clickStep(page,'proof-next','task',meta);
    check(await page.getByTestId('proof-step-panel').getByRole('radio').count()===4,'Task choice count changed',{...meta,category:category.id});
    await geometry(page,meta,`${category.id}-task-entry`,categoryIndex===0||category.id==='carpentry-trim-repair');
    for(const task of category.tasks) {
      if(await step(page)==='result')await clickStep(page,'proof-back','review',meta);
      if(await step(page)==='review')await clickStep(page,'proof-back','task',meta);
      const option=page.getByTestId(`proof-task-${task.id}`);
      check(await option.getAttribute('aria-label')===task.label,'Task accessible name lost its full scope',{...meta,task:task.id});
      await option.click();await settle(page);
      const critical=['carpentry-window-repair','electrical-ceiling-fan'].includes(task.id);
      await geometry(page,meta,`${task.id}-selected`,critical);
      if(task.description)check(clean(await page.getByTestId('proof-selection-help').innerText())===clean(task.description),'Selected task lost its scope qualifier',{...meta,task:task.id});
      await clickStep(page,'proof-next','review',meta);
      const review=await page.getByTestId('proof-review').innerText();
      check(clean(review).includes(clean(task.label)),'Review lost full task name',{...meta,task:task.id});
      if(task.description)check(clean(review).includes(clean(task.description)),'Review lost scope qualifier',{...meta,task:task.id});
      await geometry(page,meta,`${task.id}-review`,critical||(categoryIndex===0&&task===category.tasks[0]));
      await clickStep(page,'proof-next','result',meta);await assertResult(page,task,meta);
      await geometry(page,meta,`${task.id}-result`,critical||task.id==='drywall-ceiling-patch');
      journeys.push({...meta,task:task.id,kind:task.range?'priced':'unpriced',expected:task.range,status:'observed'});
    }
  }
}
async function historyAndKeyboard(page,meta) {
  await categoryStep(page,meta);
  const group=page.getByTestId('proof-step-panel').getByRole('radiogroup');
  await group.getByRole('radio',{checked:true}).focus();
  for(const [key,index]of [['Home',0],['ArrowRight',1],['End',5],['ArrowLeft',4]]) {
    await page.keyboard.press(key);await settle(page);
    const checked=group.getByRole('radio',{checked:true});
    check(await checked.getAttribute('data-testid')===`proof-category-${expected.categories[index].id}`,'Radio keyboard order or selection failed',{...meta,key});
    check(await checked.evaluate(element=>element===document.activeElement),'Radio keyboard selection lost focus',{...meta,key});
  }
  await page.getByTestId('proof-category-plumbing-repairs').click();await clickStep(page,'proof-next','task',meta);
  check(await page.getByTestId('proof-next').isDisabled(),'A new category advanced before a task was selected',meta);
  const target=expected.categories.find(c=>c.id==='plumbing-repairs').tasks[0];
  await page.getByTestId(`proof-task-${target.id}`).focus();await page.keyboard.press('Enter');await settle(page);
  check(await step(page)==='task','Enter on a choice unexpectedly advanced the step',meta);
  await page.getByTestId('proof-next').focus();await page.keyboard.press('Enter');await expectStep(page,'review',meta);
  await clickStep(page,'proof-back','task',meta);
  check(await page.getByTestId(`proof-task-${target.id}`).getAttribute('aria-checked')==='true','Back lost the selected task',meta);
  await clickStep(page,'proof-next','review',meta);await clickStep(page,'proof-next','result',meta);
  const before=await page.evaluate(key=>JSON.parse(sessionStorage.getItem(key)),STORAGE_KEY);
  check(JSON.stringify(Object.keys(before).sort())===JSON.stringify(['categoryId','step','taskId','version']),'Stored planning data contains more than IDs and step',meta);
  check(!PRIVATE.test(JSON.stringify(before)),'Stored planning data contains private finance',meta);
  meta.phase='bootstrap';await page.reload({waitUntil:'networkidle',timeout:180000});await ready(page);await expectStep(page,'result',meta);meta.phase='calculator';
  const after=await page.evaluate(key=>JSON.parse(sessionStorage.getItem(key)),STORAGE_KEY);
  check(JSON.stringify(before)===JSON.stringify(after),'Refresh lost selections or current step',meta);await assertResult(page,target,meta);
  await page.evaluate(()=>history.back());await expectStep(page,'review',meta);
  check(clean(await page.getByTestId('proof-review').innerText()).includes(target.label),'Browser Back lost the selected task',meta);
  await page.evaluate(()=>history.forward());await expectStep(page,'result',meta);await assertResult(page,target,meta);
  journeys.push({...meta,kind:'keyboard-back-refresh-history-forward',status:'observed'});
  await page.getByTestId('proof-cta-contact').focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>location.hash==='#consult');
  check(await page.locator('#consult form').count()===1,'Quote link lost its public form target',meta);
  check(await page.evaluate(()=>window.__handymanAcceptanceSubmits||0)===0,'A form submit was attempted',meta);
}
async function storageFailure(viewport) {
  const {context,page,meta}=await contextFor(viewport,'storage-blocked');
  try {
    await openPage(page,meta);
    check(await page.getByTestId('proof-storage-note').count()===1,'Storage failure is not disclosed',meta);
    await geometry(page,meta,'storage-error-result',viewport.width===320||viewport.height===390);
    await categoryStep(page,meta);await page.getByTestId('proof-category-electrical-repairs').click();await clickStep(page,'proof-next','task',meta);
    await page.getByTestId('proof-task-electrical-ceiling-fan').click();await settle(page);await geometry(page,meta,'storage-error-task',false);
    await clickStep(page,'proof-next','review',meta);await geometry(page,meta,'storage-error-review',false);
    await clickStep(page,'proof-next','result',meta);await assertResult(page,expected.categories.find(c=>c.id==='electrical-repairs').tasks[2],meta);
    await geometry(page,meta,'storage-error-complete',viewport.width===320||viewport.height===390);
    journeys.push({...meta,kind:'storage-failure-recovery',status:'observed'});
  }catch(error){failures.push({...meta,message:error.message});}finally{check(await page.evaluate(()=>window.__handymanAcceptanceSubmits||0).catch(()=>-1)===0,'A form submit was attempted',meta);await context.close();}
}

(async()=>{
  const executablePath=process.env.PLAYWRIGHT_CHROMIUM_PATH||process.env.HANDYMAN_PLANNING_CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
  browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{}),args:['--disable-background-networking','--disable-component-update','--disable-sync','--no-first-run']});
  const version=browser.version();
  for(const [width,height]of viewports) {
    const {context,page,meta}=await contextFor({width,height});
    try {await openPage(page,meta,true);await allTasks(page,meta);await historyAndKeyboard(page,meta);}
    catch(error){failures.push({...meta,message:error.message});}
    finally{check(await page.evaluate(()=>window.__handymanAcceptanceSubmits||0).catch(()=>-1)===0,'A form submit was attempted',meta);await context.close();}
    await storageFailure({width,height});
    console.log(JSON.stringify({viewport:`${width}x${height}`,observedTasks:journeys.filter(j=>j.viewport===`${width}x${height}`&&j.mode==='normal'&&j.task).length,failures:failures.filter(f=>f.viewport===`${width}x${height}`).length}));
  }
  const normal=await contextFor({width:390,height:844},'motion','no-preference');normal.meta.reducedMotion='no-preference';
  try {await openPage(normal.page,normal.meta);await clickStep(normal.page,'proof-back','review',normal.meta);await normal.page.waitForTimeout(350);const facts=await geometry(normal.page,normal.meta,'motion-review',true);check(facts.animation&&facts.animation.name!=='none'&&facts.animation.duration.split(',').some(value=>Math.abs(parseFloat(value)-.3)<.01),'Normal-motion step transition is not300ms',normal.meta);journeys.push({...normal.meta,kind:'normal-motion',status:'observed'});}catch(error){failures.push({...normal.meta,message:error.message});}finally{await normal.context.close();}
  await browser.close();browser=null;
  check(journeys.filter(j=>j.mode==='normal'&&j.task).length===24*viewports.length,'Not every task was observed at every requested viewport');
  for(const error of consoleErrors.filter(item=>item.phase==='calculator'))check(false,'Uncaught browser error during calculator acceptance',error);
  const report={identity,checkedAt:new Date().toISOString(),browser:version,node:process.version,base:base.href,viewports,fullRequestedMatrix:JSON.stringify(viewports)===JSON.stringify(MATRIX),expectedSha256:crypto.createHash('sha256').update(expectedBytes).digest('hex'),expectedTaskCount:24,taskObservations:journeys.filter(j=>j.mode==='normal'&&j.task).length,records,journeys,failures,consoleErrors,captures,textKeyboard:'NOT APPLICABLE: this fixed-choice flow has no text-entry controls. Emulation is not physical-device or on-screen-keyboard evidence.',productionBundleReview:'NOT RUN by this driver; inspect emitted public production JS/maps separately.',reviewStatus:'Functional and measured evidence only; independent visual review and authorized release gates remain separate.'};
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(out,'requests.json'),JSON.stringify(requests,null,2));
  console.log(JSON.stringify({records:records.length,taskObservations:report.taskObservations,viewports:viewports.length,failures:failures.length,report:path.join(out,'report.json')}));
  if(failures.length)process.exitCode=1;
})().catch(async error=>{if(browser)await browser.close().catch(()=>{});fs.writeFileSync(path.join(out,'fatal.json'),JSON.stringify({identity,message:error.message,failures,records,requests},null,2));console.error(error.message);process.exitCode=1;});
