// Verify whole production documents, including metadata, JSON-LD and shared cards.
// Scope is the corrected shared consumers, not a global editorial audit.
import {readFileSync, readdirSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const publicDocument = html => html.replace(/<script\b([^>]*)>[\s\S]*?<\/script>/gi, (script, attrs) => /type=["']application\/ld\+json["']/i.test(attrs) ? script : '');
const knownRoutes=JSON.parse(readFileSync(new URL("./known-claims-routes.json",import.meta.url),"utf8"));
assert.equal(new Set(knownRoutes).size,72);
const cities=['boise','meridian','nampa','eagle','kuna','caldwell','star','middleton','garden-city'];
const routes=['/','/contact','/guides/boise-home-maintenance-guide','/guides/treasure-valley-exterior-home-care-guide','/guides/boise-handyman-guide','/guides/eagle-handyman-guide','/guides/harris-ranch-handyman-guide','/guides/middleton-handyman-guide','/guides/star-handyman-guide','/services','/services/home-repairs','/blog/energy-saving-home-fixes-boise',...cities.map(c=>`/areas/${c}`)];
const unsupported=/Upfront quotes and one-trip fixes|one-visit work almost without exception|Nearly all of it is one-visit work|classic one-visit handyman work|one-visit punch-list work|quoted flat, finished in one trip|Repair in one trip|all in one visit|job finishes in one trip|each visit is a half day|one-visit plan, usually within a day|flat quotes starting at|most items are one-visit work|we arrive with materials for all of it|planning from|\$145|\$149|\$199|\$60 to \$120|(?:within|inside) one business day|same-week scheduling|most jobs.{0,60}(?:single|one) (?:visit|trip)|usually finished in one visit|knocked out in one trip|fixed or swapped in a single visit|usually within the week|single half-day handyman visit|all of them fit in one handyman visit/ig;
for(const route of knownRoutes.filter(r=>!r.endsWith('.txt'))){
 const html=readFileSync(`.next/server/app${route==='/'?'/index':route}.html`,'utf8');
 assert.match(html,/<h1[\s>]/,`${route}: meaningful page required`);
 assert.doesNotMatch(html,unsupported,`${route}: full document claim check`);
}
for(const route of ['/','/contact']){
 const html=readFileSync(`.next/server/app${route==='/'?'/index':route}.html`,'utf8');
 assert.doesNotMatch(html,/fixed or swapped in a single visit|knocked out in one trip/i,`${route}: shared schema description`);
}
for(const route of ['/blog','/sitemap','/guides/boise-home-maintenance-guide','/blog/category/home-maintenance']){
 const html=readFileSync(`.next/server/app${route==='/'?'/index':route}.html`,'utf8');
 assert.match(html,/Energy-Saving Home Fixes for Boise Houses/);
 assert.doesNotMatch(html,/all of them fit in one handyman visit|Energy-Saving Fixes a Handyman Can Do in an Afternoon/);
}
for(const file of ['llms.txt','llms-full.txt'])assert.doesNotMatch(readFileSync(`public/${file}`,'utf8'),unsupported,file);
assert.match(readFileSync('.next/server/app/areas/meridian.html','utf8'),/R-FEN/);
assert.match(readFileSync('.next/server/app/areas/garden-city.html','utf8'),/\$500 or less/);
assert.match(readFileSync('.next/server/app/guides/meridian-handyman-guide.html','utf8'),/one-trip completion as the goal/);
console.log(`Shared claim verification passed: ${knownRoutes.length-2} complete pages, 4 article-link consumers, 2 schema consumers, 2 generated references; municipal facts and conditional goal preserved.`);

function documents(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?documents(path.join(dir,e.name)):e.name.endsWith('.html')?[path.join(dir,e.name)]:[]);}
const sharedConsumers=documents('.next/server/app').filter(file=>/reviewed for repair or replacement|planned around your repair list/.test(readFileSync(file,'utf8')));
for(const file of sharedConsumers)assert.doesNotMatch(readFileSync(file,'utf8'),/fixed or swapped in a single visit|knocked out in one trip/i,file);
console.log(`Verified shared description consumers across ${sharedConsumers.length} built documents.`);

// Editorial repair-price placeholders are excluded from these exact guide/article documents.
// Municipal permit fees and homeowner tool examples remain outside this price assertion.
for (const route of ['/guides/boise-home-maintenance-guide','/guides/treasure-valley-exterior-home-care-guide','/guides/boise-handyman-guide','/guides/eagle-handyman-guide','/guides/harris-ranch-handyman-guide','/guides/middleton-handyman-guide','/guides/star-handyman-guide','/blog/seasonal-home-maintenance-checklist-boise']) {
 const html=readFileSync(`.next/server/app${route}.html`,'utf8');
 assert.doesNotMatch(publicDocument(html),/\$\d/,`${route}: no undocumented service-price ranges in body, metadata or JSON-LD`);
}
assert.doesNotMatch(publicDocument(readFileSync('.next/server/app/guides/first-time-homeowner-repair-handbook.html','utf8')),/\$(?:75|100|150|200|250|300|350|500|2,000)\b|visit handles the whole list in one trip/);
