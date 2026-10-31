/**
 * Two hero behaviours that must not drift into each other:
 *
 * - Paid-traffic pages (lib/adLandingPaths.ts) keep the owner's call-first
 *   hero from 19 and 27 October 2026: Call comes before any request action.
 * - Every other service, city and area page leads with the site primary,
 *   "Send your list and photos", and carries the phone as a text link after it.
 *
 * The real page components are server-rendered here (CSS stubbed), so the
 * test reads the markup a visitor gets, not the source text.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import {readFileSync} from 'node:fs';

const extensions=(Module as unknown as {_extensions:Record<string,(m:{exports:unknown})=>void>})._extensions;
const classNames=new Proxy({},{get:(_,key)=>String(key)});
extensions['.css']=(m)=>{m.exports={__esModule:true,default:classNames};};

type Page=(props:{params:Promise<Record<string,string>>})=>Promise<unknown>;
async function render(file:string,params:Record<string,string>):Promise<string>{
 // tsconfig keeps JSX for Next, so tsx compiles it to React.createElement.
 (globalThis as {React?:unknown}).React=(await import('react')).default;
 // Next ships a React build with resource hints; the plain react-dom here may
 // not have preload, which only adds a <link> hint and has no effect on markup.
 const reactDom=(await import('react-dom')) as unknown as {default?:Record<string,unknown>}&Record<string,unknown>;
 for(const target of [reactDom,reactDom.default])if(target&&typeof target.preload!=='function')try{target.preload=()=>{};}catch{}
 const {renderToStaticMarkup}=await import('react-dom/server');
 const mod=await import(file) as {default:Page};
 const element=await mod.default({params:Promise.resolve(params)});
 // The inline request form on the paid pages reads React Query, as in the app shell.
 // Resolve it through require, the same module instance the page code loads.
 const load=Module.createRequire(process.cwd()+'/');
 const {QueryClient,QueryClientProvider}=load('@tanstack/react-query');
 const React=load('react');
 const tree=React.createElement(QueryClientProvider,{client:new QueryClient()},element as never);
 return renderToStaticMarkup(tree);
}
function heroOf(html:string):string{
 const start=html.indexOf('interior-hero');
 const end=html.indexOf('</section>',start);
 assert.ok(start>=0&&end>start,'hero section rendered');
 return html.slice(start,end);
}
const PRIMARY='Send your list and photos';

test('the ad landing list names the paid service pages and the funnel',async()=>{
 const {AD_CALL_FIRST_PATHS,AD_FUNNEL_PATH,isAdCallFirstPath}=await import('../lib/adLandingPaths.ts');
 assert.equal(AD_FUNNEL_PATH,'/handyman');
 for(const path of ['/services/drywall-repair','/services/home-maintenance','/services/carpentry-trim-repair']){
  assert.ok(AD_CALL_FIRST_PATHS.includes(path),path);
  assert.equal(isAdCallFirstPath(path),true,path);
 }
 assert.equal(isAdCallFirstPath('/services/plumbing-repairs'),false);
 assert.equal(isAdCallFirstPath('/services/drywall-repair/boise'),false);
});

for(const slug of ['drywall-repair','home-maintenance']){
 test(`/services/${slug} keeps the call-first paid hero (Call Us and Text Us first)`,async()=>{
  const hero=heroOf(await render('../app/services/[slug]/page.tsx',{slug}));
  const call=hero.indexOf('>Call Us<');
  assert.ok(call>=0,'Call Us in the hero');
  assert.ok(hero.indexOf('>Text Us<')>call,'Text Us follows Call Us');
  assert.ok(hero.includes('data-landing-contact'),'the paid contact actions render');
  assert.equal(hero.includes('button-primary-service-hero'),false,'no site-primary hero button on an ad page');
  assert.equal(hero.includes('Prefer to talk?'),false);
 });
}

test('/services/carpentry-trim-repair keeps the filled Call before the request actions',async()=>{
 const hero=heroOf(await render('../app/services/[slug]/page.tsx',{slug:'carpentry-trim-repair'}));
 const call=hero.indexOf('data-testid="button-call-service-hero"');
 const primary=hero.indexOf(PRIMARY);
 assert.ok(call>=0,'filled Call button in the hero');
 assert.ok(primary>call,'Call comes before the request action');
 assert.equal(hero.includes('Prefer to talk?'),false);
});

for(const [file,params,label] of [
 ['../app/services/[slug]/page.tsx',{slug:'plumbing-repairs'},'/services/plumbing-repairs'],
 ['../app/services/[slug]/[city]/page.tsx',{slug:'drywall-repair',city:'boise'},'/services/drywall-repair/boise'],
 ['../app/areas/[city]/page.tsx',{city:'kuna'},'/areas/kuna'],
] as const){
 test(`${label} leads with the site primary and keeps the phone as a text link`,async()=>{
  const hero=heroOf(await render(file,{...params}));
  const primary=hero.indexOf('data-testid="button-primary-service-hero"');
  const phone=hero.indexOf('data-testid="link-call-service-hero"');
  assert.ok(primary>=0,'filled primary in the hero');
  assert.ok(hero.indexOf(PRIMARY)>primary,'primary carries the site label');
  assert.ok(phone>primary,'phone text link follows the primary');
  assert.ok(hero.slice(phone).includes('Prefer to talk? Call'),'phone is a text link');
  assert.equal(hero.includes('data-testid="button-call-service-hero"'),false,'no filled Call button');
  assert.equal(hero.includes('data-landing-contact'),false);
 });
}

test('the /handyman funnel keeps Call and Text first with its own bar',()=>{
 const source=readFileSync('app/handyman/page.tsx','utf8');
 const hero=source.indexOf('<LandingContactActions');
 assert.ok(hero>=0,'funnel hero contact actions');
 assert.match(source,/<LandingMobileActions \/>/);
 const actions=readFileSync('components/marketing/LandingContactActions.tsx','utf8');
 assert.ok(actions.indexOf('Call Us')<actions.indexOf('Text Us'),'Call before Text');
});
