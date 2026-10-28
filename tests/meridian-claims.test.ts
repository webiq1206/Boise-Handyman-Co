import test from 'node:test';
import assert from 'node:assert/strict';
import {getGuideBySlug} from '../shared/guideContent.ts';
import {getAreaCityCopy} from '../shared/content/areaCopy.ts';
const forbidden=/\$145|\$100\s*(?:to|–|and|-)\s*\$?500|within (?:one business |a )day|within (?:the |a )week|half.day|eight to twelve|8[–-]12|most jobs finished in one visit/i;
test('actual Meridian guide record excludes placeholder price and delivery claims',()=>{
 const g=getGuideBySlug('meridian-handyman-guide');assert(g);assert.match(g.title,/Meridian/);
 assert.doesNotMatch(JSON.stringify([g.content,g.quickAnswer,g.keyTakeaways,g.faqs]),forbidden);
 assert.match(g.content,/scope/);assert.match(g.content,/href="\/contact"/);
});
test('Meridian area source keeps local context and permit fees without reply promises',()=>{
 const c=getAreaCityCopy('meridian');assert(c);assert.doesNotMatch(JSON.stringify(c),forbidden);
 assert.match(JSON.stringify(c),/R-FEN/);assert.match(JSON.stringify(c),/\$10/);
});

import {getAreaIntro} from '../shared/seoContent.ts';
import {CITIES} from '../shared/contentData.ts';
test('composed Meridian area introduction does not append a single-visit promise',()=>assert.doesNotMatch(getAreaIntro(CITIES.find(c=>c.slug==='meridian')!),forbidden));

import {SERVICES} from '../shared/contentData.ts';
test('shared service cards describe scope without unconditional trip promises',()=>{
 for(const service of SERVICES)assert.doesNotMatch(service.shortDescription,/fixed or swapped in a single visit|knocked out in one trip/);
 assert.match(SERVICES.find(s=>s.slug==='plumbing-repairs')!.shortDescription,/repair or replacement/);
 assert.match(SERVICES.find(s=>s.slug==='home-maintenance')!.shortDescription,/repair list/);
});

import {readFileSync} from 'node:fs';
test('copied blog service description cannot retain unconditional trip wording',()=>assert.doesNotMatch(readFileSync('shared/content/wave2/energy-saving-home-fixes-boise.ts','utf8'),/knocked out in one trip/));

const sharedUnsupported = /planning from|\$145|\$149|\$199|\$60 to \$120|(?:within|inside) one business day|same-week scheduling|most jobs.{0,60}(?:single|one) (?:visit|trip)|usually finished in one visit|knocked out in one trip|fixed or swapped in a single visit|preliminary planning/i;
for (const city of CITIES) test(`complete ${city.slug} area data excludes unqualified sales promises`, () => {
 assert.doesNotMatch(JSON.stringify([getAreaCityCopy(city.slug), getAreaIntro(city)]), sharedUnsupported);
});
for (const file of ['public/llms.txt','public/llms-full.txt']) test(`${file} excludes placeholder prices and instant-price wording`, () => {
 const text=readFileSync(file,'utf8');assert.doesNotMatch(text,sharedUnsupported);assert.doesNotMatch(text,/instant estimator|within the week|two business days/i);
 assert.match(text,/written quote/);assert.match(text,/\/estimate/);
});
test('service index does not render the placeholder planningFrom field',()=>assert.doesNotMatch(readFileSync('app/services/page.tsx','utf8'),/service.planningFrom|realistic range|preliminary estimate/));
