import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SERVICE_SEO_CONTENT} from '../shared/seoContent.ts';
const services=['drywall-repair','home-maintenance','carpentry-trim-repair','mounting-assembly','painting-touch-ups','fence-deck-gutter-repair'];
for(const slug of services)test(`${slug} gives reviewed scope guidance rather than placeholder prices`,()=>{const c=SERVICE_SEO_CONTENT[slug];assert(c);assert.doesNotMatch(JSON.stringify(c),/\$\d/);assert.match(c.timeline,/depends/);assert.match(c.costGuidance!.paragraphs.join(' '),/quote/);assert(c.faqs.length>0);});
test('maintenance does not promise every list in one visit',()=>{const c=SERVICE_SEO_CONTENT['home-maintenance'];assert.doesNotMatch(c.overview,/cleared in a single visit/);const a=c.faqs.find(f=>f.question.includes('whole punch list'))!.answer;assert.match(a,/depends/);assert.doesNotMatch(a,/eight to twelve|half a day|Yes, that is/);});
test('service hero does not publish unconfirmed planningFrom prices',()=>{const s=readFileSync('app/services/[slug]/page.tsx','utf8');assert.doesNotMatch(s,/planningFrom=\{service.planningFrom\}/);assert.match(s,/Request a repair estimate/);});
test('RE10 requests do not guarantee completion before closing or same-day response',()=>{const s=readFileSync('app/re-10-repairs-boise/page.tsx','utf8')+readFileSync('shared/content/re10Content.ts','utf8');assert.doesNotMatch(s,/RE-10 repairs completed before closing|hear about it the same day|within one business day of receiving/);});

import {CITIES} from '../shared/contentData.ts';
import {getCityServiceIntro,getCityServiceSections,cityServicePageFaqs} from '../shared/seoContent.ts';
for(const slug of [...services,'plumbing-repairs','electrical-repairs']) {
 test(`${slug} root price/timing is reviewed rather than a placeholder`,()=>{
  const c=SERVICE_SEO_CONTENT[slug];assert.doesNotMatch(JSON.stringify(c.costGuidance)+JSON.stringify(c.faqs),/\$\d/);
 });
 for(const city of CITIES)test(`${slug}/${city.slug} full composed city copy has no placeholder price or promised response/week`,()=>{
  const c=SERVICE_SEO_CONTENT[slug];
  const rendered=JSON.stringify([getCityServiceIntro(c,city),getCityServiceSections(c,city,undefined),cityServicePageFaqs(c,city)]);
  assert.doesNotMatch(rendered,/\$(?:129|145|149|199)\b|within (?:the |a |one )?week|business day|preliminary planning range|single visit/i);
  assert.match(rendered,/scope/i);assert.match(rendered,/quote/i);
 });
}
test('all city hero prices remain unpublished until verified',()=>assert.doesNotMatch(readFileSync('app/services/[slug]/[city]/page.tsx','utf8'),/planningFrom=\{service.planningFrom\}/));

test('Meridian shared local guidance does not assert an unverified item price',()=>assert.doesNotMatch(readFileSync('shared/content/locationGuides.ts','utf8'),/Very little of it is over \$500/));
