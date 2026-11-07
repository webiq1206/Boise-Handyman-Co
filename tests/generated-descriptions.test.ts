/**
 * The generated meta descriptions (8 service pages, 9 area pages, 72 service x
 * city pages, plus the home and generic fallbacks) used to end in
 * "Call (208) 477-1169 to book a visit!" and ran 100 to 133 characters with
 * the keyword second. These rules keep the generators from drifting back:
 * keyword first, 140 to 155 characters, no phone number, no exclamation mark,
 * and no two pages sharing a description.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildPageMetadata} from '../lib/page-metadata.ts';
import {DESCRIPTION_MAX,DESCRIPTION_MIN,generateMetaDescription} from '../lib/seo.ts';
import {CITIES,SERVICES} from '../shared/contentData.ts';
import {BOISE_AREA_DESCRIPTION,CALDWELL_AREA_DESCRIPTION,HOME_DESCRIPTION} from '../shared/p5VisibilityCopy.ts';

const PHONE=/\(?\d{3}\)?[\s.-]*\d{3}[\s.-]*\d{4}/;

function check(label:string,description:string,keyword:RegExp){
 assert.ok(description.length>=DESCRIPTION_MIN&&description.length<=DESCRIPTION_MAX,`${label} is ${description.length} characters: ${description}`);
 assert.equal(PHONE.test(description),false,`${label} carries a phone number: ${description}`);
 assert.equal(description.includes('!'),false,`${label} carries an exclamation mark: ${description}`);
 assert.match(description,keyword,`${label} does not open with its keyword: ${description}`);
}

test('service, area and service x city descriptions are keyword first, 140 to 155 characters, phone and "!" free',()=>{
 const seen=new Map<string,string>();
 const add=(label:string,description:string)=>{
  assert.equal(seen.has(description),false,`${label} duplicates ${seen.get(description)}`);
  seen.set(description,label);
 };
 for(const service of SERVICES){
  const meta=buildPageMetadata({kind:'service',serviceName:service.name,serviceSlug:service.slug,path:`/services/${service.slug}`});
  const description=String(meta.description);
  check(service.slug,description,/^[A-Z][\w ,-]+ in Boise and the Treasure Valley/);
  add(service.slug,description);
  for(const city of CITIES){
   const cityMeta=buildPageMetadata({kind:'city-service',serviceName:service.name,serviceSlug:service.slug,cityName:city.name,citySlug:city.slug,path:`/services/${service.slug}/${city.slug}`});
   const cityDescription=String(cityMeta.description);
   check(`${service.slug}/${city.slug}`,cityDescription,new RegExp(`^[A-Z][\\w ,-]+ in ${city.name}, Idaho`));
   add(`${service.slug}/${city.slug}`,cityDescription);
  }
 }
 for(const city of CITIES){
  const meta=buildPageMetadata({kind:'area',cityName:city.name,citySlug:city.slug,path:`/areas/${city.slug}`});
  const description=String(meta.description);
  if(city.slug==='boise'){
   assert.equal(description,BOISE_AREA_DESCRIPTION);
   check(`/areas/${city.slug}`,description,/^From North End plaster/);
  }else if(city.slug==='caldwell'){
   assert.equal(description,CALDWELL_AREA_DESCRIPTION);
   check(`/areas/${city.slug}`,description,/^Get your Caldwell repair list/);
  }else{
   check(`/areas/${city.slug}`,description,new RegExp(`^Handyman in ${city.name}, Idaho`));
  }
  add(`/areas/${city.slug}`,description);
 }
 const home=generateMetaDescription({serviceName:'',serviceSlug:'',isHomePage:true});
 assert.equal(home,HOME_DESCRIPTION);
 check('home',home,/^Hand us your repair list/);
 check('generic',generateMetaDescription({serviceName:'',serviceSlug:''}),/^Handyman services in Boise/);
});
