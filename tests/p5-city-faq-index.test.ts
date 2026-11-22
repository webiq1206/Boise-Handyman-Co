import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {landingFAQSchema} from '../lib/landing-schema.ts';
import {buildPageMetadata,isCityServiceNoindex,NOINDEX_CITY_SERVICE} from '../lib/page-metadata.ts';
import {getAllSiteUrls} from '../lib/siteUrls.ts';
import robots from '../app/robots.ts';
import {withBrandPageMetadata} from '../lib/brand-page-metadata.ts';
import {CITIES,SERVICES} from '../shared/contentData.ts';
import {getAreaCityCopy} from '../shared/content/areaCopy.ts';
import {CITY_SERVICE_COPY} from '../shared/content/cityServiceCopy.ts';
import {getCityOnlyFaqs} from '../shared/cityPageFacts.ts';
import {AREA_PAGE_FAQS,SERVICE_SEO_CONTENT,areaPageFaqs,cityServicePageFaqs,getAreaIntro,getCityServiceFaqs,getCityServiceIntro,getCityServiceSections} from '../shared/seoContent.ts';
import {CITY_SEO_DATA} from '../lib/seo.ts';

// Phase 4 (owner-approved plan): keyword-first homepage title from one source.
const HOME_TITLE='Boise Handyman Services | Upfront Quotes | Boise Handyman Co';
const HOME_DESCRIPTION='Boise handyman for small repairs, installs and home maintenance across the Treasure Valley. One written quote before work starts. Send your list today.';
const NOINDEX_TODAY=[
 'carpentry-trim-repair/nampa',
 'drywall-repair/kuna',
 'electrical-repairs/caldwell',
 'fence-deck-gutter-repair/eagle',
 'home-maintenance/eagle',
 'mounting-assembly/caldwell',
 'plumbing-repairs/star',
];
const INDEXED_TODAY=[
 'drywall-repair/boise',
 'painting-touch-ups/meridian',
 'electrical-repairs/eagle',
 'plumbing-repairs/nampa',
 'mounting-assembly/nampa',
 'home-maintenance/boise',
 'fence-deck-gutter-repair/meridian',
];

function read(path:string){
 return readFileSync(path,'utf8');
}

function faqPairs(faqs:Array<{question:string;answer:string}>){
 const schema=landingFAQSchema(faqs);
 const entities=schema.mainEntity as Array<{name:string;acceptedAnswer:{text:string}}>;
 return entities.map((entity)=>({question:entity.name,answer:entity.acceptedAnswer.text}));
}

test('visible area, service-city, and hub FAQs match FAQPage JSON-LD',()=>{
 for(const city of CITIES){
  const faqs=areaPageFaqs(city);
  assert.deepEqual(faqPairs(faqs),faqs,`/areas/${city.slug}`);
  const published=getAreaCityCopy(city.slug)?.faqs??[];
  assert.ok(published.length>0,`${city.slug} keeps its published area FAQs`);
  assert.deepEqual(faqs.slice(0,published.length),published,`${city.slug} published FAQs stay first and unchanged`);
  const added=getCityOnlyFaqs(city);
  assert.equal(added.length,2);
  assert.deepEqual(faqs.slice(published.length),added,`${city.slug} appends the two city-only questions`);
  assert.equal(new Set(faqs.map((faq)=>faq.question)).size,faqs.length);
 }
 for(const service of SERVICES){
  const content=SERVICE_SEO_CONTENT[service.slug];
  assert.ok(content,service.slug);
  for(const city of CITIES){
   const faqs=cityServicePageFaqs(content,city);
   assert.deepEqual(faqPairs(faqs),faqs,`/services/${service.slug}/${city.slug}`);
   const published=getCityServiceFaqs(content,city);
   assert.deepEqual(faqs.slice(0,published.length),published);
   const override=CITY_SERVICE_COPY[`${service.slug}/${city.slug}`];
   if(override)assert.deepEqual(published,override.faqs);
   const added=getCityOnlyFaqs(city,content.name);
   assert.deepEqual(faqs.slice(published.length),added);
   assert.equal(new Set(faqs.map((faq)=>faq.question)).size,faqs.length);
  }
 }
 assert.deepEqual(faqPairs(AREA_PAGE_FAQS),AREA_PAGE_FAQS);
 const hub=read('app/areas/page.tsx');
 assert.match(hub,/landingFAQSchema\(AREA_PAGE_FAQS\)/);
 assert.match(hub,/AREA_PAGE_FAQS\.map\(\(faq\)/);
 const area=read('app/areas/[city]/page.tsx');
 assert.match(area,/const faqs = areaPageFaqs\(city\)/);
 assert.match(area,/landingFAQSchema\(faqs\)/);
 assert.match(area,/faqs=\{faqs\}/);
 assert.doesNotMatch(area,/landingFAQSchema\(cityFaqs\)/);
 const servicePage=read('app/services/[slug]/[city]/page.tsx');
 assert.match(servicePage,/const faqs = cityServicePageFaqs\(content, city\)/);
 assert.match(servicePage,/landingFAQSchema\(faqs\)/);
 assert.match(servicePage,/faqs=\{faqs\}/);
 assert.doesNotMatch(servicePage,/landingFAQSchema\(cityFaqs\)/);
});

test('published city claims and the Kuna and Caldwell neighborhood order stay',()=>{
 const boise=CITIES.find((city)=>city.slug==='boise')!;
 const kuna=CITIES.find((city)=>city.slug==='kuna')!;
 const caldwell=CITIES.find((city)=>city.slug==='caldwell')!;
 assert.match(getAreaIntro(boise),/median home was built in 1986/);
 assert.match(getAreaIntro(boise),/Census ACS 2020-2024/);
 const boiseFaqs=areaPageFaqs(boise);
 assert.ok(boiseFaqs.some((faq)=>faq.answer.includes('Certificate of Appropriateness')));
 const station='the Deer Flat Dam station by Lake Lowell, southwest of Caldwell';
 for(const city of CITIES){
  const text=areaPageFaqs(city).map((faq)=>`${faq.question}\n${faq.answer}`).join('\n');
  assert.ok(text.includes('reviews permitted handyman repairs'),`${city.slug} permit answer`);
  assert.equal(text.includes('permitted a handyman repair'),false,`${city.slug} drops the old permit grammar`);
 }
 assert.deepEqual(CITY_SEO_DATA.Eagle.neighborhoods,['Banbury','Floating Feather']);
 assert.equal(CITY_SEO_DATA.Eagle.neighborhoods.includes('The Estates'),false);
 assert.deepEqual(CITY_SEO_DATA.Nampa.landmarks,['Ford Idaho Center','Nampa Train Depot']);
 assert.equal(CITY_SEO_DATA.Nampa.landmarks.includes('Lake Lowell'),false);
 assert.deepEqual(CITY_SEO_DATA.Middleton.landmarks,['the Boise River']);
 assert.equal(CITY_SEO_DATA.Middleton.landmarks.join(' ').includes('Middleton City Park'),false);
 assert.ok(areaPageFaqs(caldwell).some((faq)=>faq.answer.includes(station)));
 assert.ok(CITY_SERVICE_COPY['home-maintenance/caldwell'].faqs.some((faq)=>faq.answer.includes(station)));
 assert.ok(CITY_SERVICE_COPY['painting-touch-ups/caldwell'].faqs.some((faq)=>faq.answer.includes(station)));
 assert.equal(CITY_SERVICE_COPY['home-maintenance/caldwell'].faqs.some((faq)=>faq.answer.includes('on Lake Lowell')),false);
 assert.ok(boiseFaqs.some((faq)=>faq.question==='Does Boise Handyman Co serve Hidden Springs and Harris Ranch?'));
 assert.ok(boiseFaqs.some((faq)=>faq.answer.includes('Other areas on our Boise service list include North End, Bench, Downtown, East End, Southwest Boise.')));
 const kunaFaqs=areaPageFaqs(kuna);
 assert.ok(kunaFaqs.some((faq)=>faq.answer.includes('Indian Creek is the creek that runs through Kuna, Nampa, and Caldwell, and Indian Creek Plaza is in Caldwell.')));
 assert.ok(kunaFaqs.some((faq)=>faq.answer.includes('including Crimson Point')));
 const caldwellFaqs=areaPageFaqs(caldwell);
 assert.ok(caldwellFaqs.some((faq)=>faq.answer.includes('Wilson, Ustick, Cleveland Blvd')));
 assert.deepEqual(CITY_SEO_DATA.Kuna.neighborhoods,['Crimson Point']);
 assert.deepEqual(CITY_SEO_DATA.Caldwell.neighborhoods,['Wilson','Ustick','Cleveland Blvd']);
 const drywall=SERVICE_SEO_CONTENT['drywall-repair'];
 assert.match(getCityServiceIntro(drywall,boise),/North End/);
 assert.ok(cityServicePageFaqs(drywall,boise).some((faq)=>faq.question.startsWith('How much') && faq.answer.includes('scope')));
 assert.ok(cityServicePageFaqs(drywall,boise).every((faq)=>!faq.answer.includes('starts around $149')));
 const kunaSections=getCityServiceSections(drywall,kuna,CITY_SEO_DATA.Kuna);
 assert.ok(kunaSections.some((section)=>section.paragraphs.some((paragraph)=>paragraph.includes('Indian Creek is the creek that runs through Kuna, Nampa, and Caldwell.'))));
 assert.ok(kunaSections.some((section)=>section.heading.startsWith('Drywall repair & patching in Kuna: homes, permits')));
});

test('noindex pages stay noindex and robots and sitemap rules are unchanged',()=>{
 assert.equal(NOINDEX_CITY_SERVICE.size,SERVICES.length*CITIES.length-26);
 for(const key of INDEXED_TODAY){
  assert.equal(NOINDEX_CITY_SERVICE.has(key),false,key);
 }
 for(const key of NOINDEX_TODAY){
  const [serviceSlug,citySlug]=key.split('/');
  assert.equal(isCityServiceNoindex(serviceSlug,citySlug),true,key);
 }
 const paths=new Set(getAllSiteUrls().map((entry)=>entry.path));
 for(const key of NOINDEX_TODAY){
  const [serviceSlug,citySlug]=key.split('/');
  assert.equal(paths.has(`/services/${serviceSlug}/${citySlug}`),false,key);
 }
 const cityServicePaths=[...paths].filter((path)=>/^\/services\/[^/]+\/[^/]+$/.test(path));
 assert.equal(cityServicePaths.length,SERVICES.length*CITIES.length-NOINDEX_CITY_SERVICE.size);
 assert.equal(paths.has('/services/drywall-repair/boise'),true);
 assert.equal(paths.has('/areas/boise'),true);
 const rules=robots();
 const base=process.env.NEXT_PUBLIC_SITE_URL||'https://boisehandyman.co';
 assert.deepEqual(rules.sitemap,[`${base}/sitemap.xml`,`${base}/sitemap-images.xml`]);
 const star=Array.isArray(rules.rules)?rules.rules.find((rule)=>rule.userAgent==='*'):undefined;
 assert.ok(star);
 assert.deepEqual(star.allow,'/');
 assert.deepEqual(star.disallow,['/api/','/admin/','/subcontractor','/subcontractor/']);
 const hidden=buildPageMetadata({kind:'city-service',serviceName:'TV Mounting & Assembly',serviceSlug:'mounting-assembly',cityName:'Kuna',citySlug:'kuna',path:'/services/mounting-assembly/kuna',noindex:true});
 assert.deepEqual(hidden.robots,{index:false,follow:true});
 const visible=buildPageMetadata({kind:'city-service',serviceName:'Drywall Repair & Patching',serviceSlug:'drywall-repair',cityName:'Boise',citySlug:'boise',path:'/services/drywall-repair/boise',noindex:false});
 assert.equal(visible.robots,undefined);
 const servicePage=read('app/services/[slug]/[city]/page.tsx');
 assert.match(servicePage,/noindex: isCityServiceNoindex\(service\.slug, city\.slug\)/);
 assert.match(read('app/sitemap.ts'),/getAllSiteUrls\(\)/);
 assert.match(read('app/admin/layout.tsx'),/index: false/);
 assert.match(read('app/estimate/scope/page.tsx'),/index:false/);
 assert.match(read('app/estimate/p5-preview/page.tsx'),/index:false/);
 assert.match(read('app/not-found.tsx'),/index: false/);
 assert.match(read('app/style-guide/page.tsx'),/index: false/);
 assert.match(read('app/subcontractor/layout.tsx'),/index: false/);
 assert.match(read('app/blog/category/[hubSlug]/page.tsx'),/indexable \? undefined : \{ index: false, follow: true \}/);
});

test('home document, Open Graph, and Twitter titles stay on the published handyman title',()=>{
 const result=withBrandPageMetadata({
  title:{absolute:'Handyman in Boise, ID | Boise Handyman Co'},
  description:'Handyman service for Boise, Meridian, Eagle, Nampa & the Treasure Valley. Small repairs, installs & maintenance with one upfront written quote before work starts. Book a visit today.',
  alternates:{canonical:'https://boisehandyman.co/'},
  openGraph:{title:'Boise Handyman Co | Treasure Valley Handyman'},
 },'/');
 assert.deepEqual(result.title,{absolute:HOME_TITLE});
 assert.equal((result.openGraph as {title?:string}).title,HOME_TITLE);
 assert.equal((result.twitter as {title?:string}).title,HOME_TITLE);
 assert.equal(result.description,HOME_DESCRIPTION);
 assert.equal(HOME_TITLE.length,60);
});
