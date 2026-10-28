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
