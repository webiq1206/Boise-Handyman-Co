import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SERVICE_SEO_CONTENT} from '../shared/seoContent.ts';
const services=['drywall-repair','home-maintenance','carpentry-trim-repair','mounting-assembly','painting-touch-ups','fence-deck-gutter-repair'];
for(const slug of services)test(`${slug} gives reviewed scope guidance rather than placeholder prices`,()=>{const c=SERVICE_SEO_CONTENT[slug];assert(c);assert.doesNotMatch(JSON.stringify(c),/\$\d/);assert.match(c.timeline,/depends/);assert.match(c.costGuidance!.paragraphs.join(' '),/quote/);assert(c.faqs.length>0);});
test('maintenance does not promise every list in one visit',()=>{const c=SERVICE_SEO_CONTENT['home-maintenance'];assert.doesNotMatch(c.overview,/cleared in a single visit/);const a=c.faqs.find(f=>f.question.includes('whole punch list'))!.answer;assert.match(a,/depends/);assert.doesNotMatch(a,/eight to twelve|half a day|Yes, that is/);});
test('service hero does not publish unconfirmed planningFrom prices',()=>{const s=readFileSync('app/services/[slug]/page.tsx','utf8');assert.doesNotMatch(s,/planningFrom=\{service.planningFrom\}/);assert.match(s,/Request a repair estimate/);});
test('RE10 requests do not guarantee completion before closing or same-day response',()=>{const s=readFileSync('app/re-10-repairs-boise/page.tsx','utf8')+readFileSync('shared/content/re10Content.ts','utf8');assert.doesNotMatch(s,/RE-10 repairs completed before closing|hear about it the same day|within one business day of receiving/);});
