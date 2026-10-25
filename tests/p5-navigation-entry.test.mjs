import test from 'node:test';
import assert from 'node:assert/strict';
import {enterEstimator} from '../scripts/lib/navigationEntry.mjs';

for (const brand of ['boise-handyman-co','boise-remodeling-co','boise-cabinet-co','boise-construction-co','p5-home-co-nextjs']) {
  for (const route of ['/','/estimate','/estimate/scope','/quote','/re-10-repairs-boise','/remodel-plans-boise']) {
    test(`${brand} ${route} preserves the intended entry`, async () => {
      const actions=[];
      const page={url:()=> 'http://fixture.test/estimate?review=1',locator(selector){
        const locator={first:()=>locator,waitFor:async()=>actions.push(['wait',selector]),click:async()=>actions.push(['click',selector]),scrollIntoViewIfNeeded:async()=>actions.push(['scroll',selector])};return locator;
      }};
      const parent=brand==='p5-home-co-nextjs';
      await enterEstimator(page,{brand,route,parent});
      const expected=parent?[]:brand==='boise-handyman-co' && ['/', '/estimate'].includes(route)
        ? [['wait','#quick-request form'],['click','a[href="/estimate?review=1"]']]
        : brand==='boise-remodeling-co' && route==='/'
          ? [['click','a[href="/#calculator"]'],['scroll','#calculator']]
          : route==='/' ? [['scroll','#calculator']] : [];
      assert.deepEqual(actions,expected);
    });
  }
}

// The held-IDB recovery scenario must enter the optional guided UI before asserting it.
test('recovery browser scenario follows the public guided entry before checking restoration', async()=>{
 const {readFile}=await import('node:fs/promises');
 const source=await readFile(new URL('../scripts/p5-estimator-browser.mjs',import.meta.url),'utf8');
 const start=source.indexOf("await page.goto(base+'/estimate');");
 const entry=source.indexOf("await enterEstimator(page,{route:'/estimate',brand:brand.id,parent:false});",start);
 const assertion=source.indexOf("name:'Preparing your saved project on this device'",start);
 assert.ok(start>=0 && entry>start && assertion>entry);
});
