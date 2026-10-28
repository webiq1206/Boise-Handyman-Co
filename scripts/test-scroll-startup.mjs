import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
const baseline=process.argv.includes('--baseline');
const bundle=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';import {ScrollToTop} from './components/ScrollToTop';import {setPath} from 'next/navigation';let root;window.mount=()=>flushSync(()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(React.StrictMode,null,React.createElement(ScrollToTop)))});window.changePath=(p)=>flushSync(()=>setPath(p));`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',define:{'process.env.NODE_ENV':'"development"'},plugins:[{name:'synthetic-path',setup(b){b.onResolve({filter:/^next\/navigation$/},()=>({path:'navigation',namespace:'synthetic'}));b.onLoad({filter:/.*/,namespace:'synthetic'},()=>({contents:`import {useSyncExternalStore} from 'react';let path='/';const listeners=new Set();export function usePathname(){return useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn)},()=>path)}export function setPath(p){path=p;for(const fn of listeners)fn()}` ,resolveDir:process.cwd()}));}}]});
let passed=0;
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch();try{for(const width of [768,1440]){
 const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();
 await context.route('**/*',r=>{assert.equal(new URL(r.request().url()).origin,'http://127.0.0.1:59991');return r.fulfill({contentType:'text/html',body:'<!doctype html><style>body{margin:0}a{display:block;margin-top:1000px;height:40px}footer{height:1500px}</style><div id="root"></div><a href="/estimate?review=1">Synthetic review</a><footer></footer>'});});
 await page.goto('http://127.0.0.1:59991/#calculator');await page.addScriptTag({content:bundle.outputFiles[0].text});
 await page.evaluate(()=>{window.scrollCalls=[];const original=window.scrollTo;window.scrollTo=function(...args){window.scrollCalls.push({args,stack:new Error().stack});return original.apply(this,args)}});
 await page.locator('a').scrollIntoViewIfNeeded();const box=await page.locator('a').boundingBox();await page.mouse.move(box.x+40,box.y+20);await page.mouse.down();
 await page.evaluate(()=>window.mount());const calls=await page.evaluate(()=>window.scrollCalls);
 if(baseline){assert.ok(calls.length>0);assert.equal(await page.evaluate(()=>scrollY),0);console.log(JSON.stringify({browser:name,width,baselineReset:true,caller:calls[0].stack.split('\n').slice(0,5)}));await page.mouse.up();passed++;await context.close();continue;}
 assert.equal(calls.length,0,'initial hydration must not reset scroll, including StrictMode replay');await page.mouse.up();await page.waitForURL('**/estimate?review=1');passed++;
 // Fresh component fixture: browser restores a position before hydration.
 await page.goto('http://127.0.0.1:59991/');await page.addScriptTag({content:bundle.outputFiles[0].text});await page.evaluate(()=>{scrollTo(0,300);window.mount()});assert.equal(await page.evaluate(()=>scrollY),300);passed++;
 await page.evaluate(()=>{history.pushState({},'','/next');window.changePath('/next')});assert.equal(await page.evaluate(()=>scrollY),0);passed++;
 await page.evaluate(()=>{scrollTo(0,260);history.pushState({},'','/hash#target');window.changePath('/hash')});assert.equal(await page.evaluate(()=>scrollY),260);passed++;
 await page.evaluate(()=>{history.replaceState({},'','/restored');scrollTo(0,380);dispatchEvent(new PopStateEvent('popstate'));window.changePath('/restored')});assert.equal(await page.evaluate(()=>scrollY),380);passed++;
 await page.evaluate(()=>{history.pushState({},'','/fresh');window.changePath('/fresh')});assert.equal(await page.evaluate(()=>scrollY),0);passed++;
 // Exercise real browser Back/forward restoration, not only a synthetic pop event.
 await page.evaluate(()=>{window.addEventListener('popstate',()=>window.changePath(location.pathname));scrollTo(0,210);history.pushState({},'','/history-next');window.changePath('/history-next');scrollTo(0,460);history.back()});
 await page.waitForFunction(()=>location.pathname==='/fresh'&&scrollY===210);passed++;
 await page.evaluate(()=>history.forward());await page.waitForFunction(()=>location.pathname==='/history-next'&&scrollY===460);passed++;
 await page.locator('a').focus();await page.keyboard.press('Enter');await page.waitForURL('**/estimate?review=1');passed++;
 console.log(`${name} ${width}: 9 interaction/restoration checks passed`);await context.close();
 }}finally{await browser.close()}
}
// Reproduce native viewport scrolling during a real pointer gesture. Read the
// production html rule rather than replacing a real click with forced navigation.
const css=await readFile('app/globals.css','utf8');
const nativeBehavior=css.match(/html\s*\{[^}]*scroll-behavior:\s*([^;]+);/)?.[1].trim();
assert.ok(nativeBehavior,'production html scroll behavior must be explicit');
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch();try{for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900}});
  await context.route('**/*',r=>{assert.equal(new URL(r.request().url()).origin,'http://127.0.0.1:59991');return r.fulfill({contentType:'text/html',body:`<!doctype html><style>html{scroll-behavior:${nativeBehavior}}body{margin:0}a{display:block;margin-top:1000px;height:40px;width:200px}footer{height:2000px}</style><a href="/estimate">Request an estimate</a><footer></footer>`});});
  const page=await context.newPage();await page.goto('http://127.0.0.1:59991/');
  const point=await page.evaluate(()=>{
   window.scrollTo({top:800,behavior:'instant'});
   window.scrollTo({top:650,behavior:'auto'});
   const r=document.querySelector('a').getBoundingClientRect();return {x:r.x+50,y:r.y+20};
  });
  await page.mouse.move(point.x,point.y);await page.mouse.down();
  // Let a pending native scroll finish while the button is held. The actual
  // anchor must still receive pointerup/click; smooth baseline loses that click.
  await page.waitForFunction(()=>scrollY===650);await page.mouse.up();
  await page.waitForURL('**/estimate');
  assert.equal(new URL(page.url()).pathname,'/estimate');passed++;
  console.log(`${name} ${width}: native scrolling preserves the pointer gesture`);await context.close();
 }}finally{await browser.close()}
}
console.log(`${passed} passed; no retries, no external requests or submissions`);
