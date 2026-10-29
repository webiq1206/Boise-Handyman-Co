import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

// The held-IDB recovery scenario must enter the optional guided UI before asserting it.
test('recovery browser scenario follows the public guided entry before checking restoration', async()=>{
 const {readFile}=await import('node:fs/promises');
 const source=await readFile(new URL('../scripts/p5-estimator-browser.mjs',import.meta.url),'utf8');
 const start=source.indexOf("await page.goto(base+retainedEstimatorPath(brand.id));");
 const entry=source.indexOf("const est=page.locator('[data-p5-estimator]')",start);
 const assertion=source.indexOf("name:'Preparing your saved project on this device'",start);
 assert.ok(start>=0 && entry>start && assertion>entry);
});

test('public route matrix enters guided UI before all original assertions',async()=>{const {readFile}=await import('node:fs/promises');const s=await readFile(new URL('../scripts/p5-estimator-browser.mjs',import.meta.url),'utf8');assert.ok(s.includes("if(isHandyman(brand.id)&&path==='/'){await verifyHandymanHomeEntry(page)"));assert.ok(s.includes("await est.getByLabel('Tell us about your project',{exact:true}).waitFor()"));});

for(const file of ['p5-intake-intent-browser.mjs','p5-exit-browser.mjs']) test(`${file} enters actual guided UI before its first estimator assertion`,async()=>{
 const {readFile}=await import('node:fs/promises');const s=await readFile(new URL('../scripts/'+file,import.meta.url),'utf8');
 const start=s.indexOf('await page.goto(base+retainedEstimatorPath('),entry=s.indexOf('));',start);
 const next=s.indexOf(file.includes('intent')?"await page.locator('[data-p5-estimator] textarea')":"await f.page.locator('[data-p5-estimator] textarea')",start);
 assert.ok(start>=0&&entry>start&&next>entry);
 assert.equal((s.match(/page\.goto\(/g)||[]).length,1,'One reviewed entry setup per script');
});


 test("intent confirmation checks the exact brand-specific submit label",()=>{const source=readFileSync("scripts/p5-intake-intent-browser.mjs","utf8");assert.match(source,/intakeCopyForSite\(brand.id\).submit/);assert.match(source,/routing.handoff\?/);});
