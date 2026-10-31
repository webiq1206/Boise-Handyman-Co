/**
 * Fails when any page asks withBrandPageMetadata to cut its title or its meta
 * description, or when any rendered description carries a phone number or an
 * exclamation mark (42 generated descriptions once ended "Call (208)
 * 477-1169 to book a visit!"). The fitter used to trim silently at 60 / 155 characters, which
 * shipped titles like "How to Hire a Handyman in the Treasure" and
 * descriptions ending "and the repair permit". A title or description that does
 * not fit is now a content defect, fixed by hand in the page or content file.
 *
 * It runs the real page modules: every app/**\/page.tsx is imported and its
 * `metadata` export or `generateMetadata` (once per generateStaticParams entry)
 * is evaluated with BRAND_METADATA_STRICT=1, which makes the fitter throw
 * instead of trimming. `next build` enforces the same rule on its own
 * (NEXT_PHASE=phase-production-build), so this script is the fast early warning.
 */
import Module,{register} from 'node:module';
import {readdirSync,statSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {descriptionContentIssues} from '../lib/brand-page-metadata.ts';

process.env.BRAND_METADATA_STRICT='1';

// Page modules import CSS (directly or through components). Node cannot load
// it, and metadata never depends on it, so stub every stylesheet as empty.
register('data:text/javascript,'+encodeURIComponent(`
export async function load(url,context,next){
 if(/\\.(css|scss|sass)(\\?.*)?$/.test(url))return {format:'module',source:'export default {};',shortCircuit:true};
 return next(url,context);
}`),import.meta.url);

// tsx loads most of the app through the CommonJS path, which needs its own stub.
const extensions=(Module as unknown as {_extensions:Record<string,(module:{exports:unknown})=>void>})._extensions;
for(const ext of ['.css','.scss','.sass'])extensions[ext]=(module)=>{module.exports={};};

const root=process.cwd();
const SKIP_DIRS=new Set(['api','admin','subcontractor']);

function pages(dir:string):string[]{
 const out:string[]=[];
 for(const name of readdirSync(dir)){
  const full=path.join(dir,name);
  if(statSync(full).isDirectory()){
   if(SKIP_DIRS.has(name))continue;
   out.push(...pages(full));
  }else if(name==='page.tsx'||name==='page.ts'){
   out.push(full);
  }
 }
 return out;
}

type PageModule={
 metadata?:unknown;
 generateMetadata?:(props:{params:Promise<Record<string,string>>;searchParams:Promise<Record<string,string>>})=>Promise<unknown>;
 generateStaticParams?:()=>Promise<Array<Record<string,string>>>|Array<Record<string,string>>;
};

function routeOf(file:string):string{
 const rel=path.relative(path.join(root,'app'),path.dirname(file)).split(path.sep).filter((part)=>!/^\(.*\)$/.test(part));
 return '/'+rel.join('/');
}

function fill(route:string,params:Record<string,string>):string{
 return route.replace(/\[([^\]]+)\]/g,(_,key:string)=>params[key]??`[${key}]`);
}

async function main(){
 const failures:string[]=[];
 let checked=0;
 const skipped:string[]=[];
 // Checked on the description the page actually renders, wrapped or not.
 const contentCheck=(where:string,meta:{description?:unknown}|undefined)=>{
  const description=typeof meta?.description==='string'?meta.description:undefined;
  for(const issue of descriptionContentIssues(description))failures.push(`${where}: ${issue}`);
 };
 for(const file of pages(path.join(root,'app')).sort()){
  const route=routeOf(file);
  let mod:PageModule;
  try{
   mod=await import(pathToFileURL(file).href) as PageModule;
  }catch(error){
   // A static `metadata` export is evaluated at import, so a fitter refusal surfaces here.
   const message=error instanceof Error?error.message:String(error);
   if(message.includes('[metadata-fit]'))failures.push(message);
   else failures.push(`${route}: could not load the page module to check its metadata: ${message.split('\n')[0]}`);
   continue;
  }
  if(mod.generateMetadata){
   const dynamic=/\[[^\]]+\]/.test(route);
   let paramSets:Array<Record<string,string>>=[{}];
   if(dynamic){
    if(!mod.generateStaticParams){skipped.push(route);continue;}
    paramSets=await mod.generateStaticParams();
   }
   for(const params of paramSets){
    checked++;
    try{
     const meta=await mod.generateMetadata({params:Promise.resolve(params),searchParams:Promise.resolve({})}) as {description?:unknown}|undefined;
     contentCheck(fill(route,params),meta);
    }catch(error){
     const message=error instanceof Error?error.message:String(error);
     failures.push(message.includes('[metadata-fit]')?`${fill(route,params)} ${message}`:`${fill(route,params)}: generateMetadata failed: ${message.split('\n')[0]}`);
    }
   }
  }else{
   checked++;
   contentCheck(route,mod.metadata as {description?:unknown}|undefined);
  }
 }
 if(skipped.length)console.log(`verify-metadata-fit: skipped dynamic routes without generateStaticParams: ${skipped.join(', ')}`);
 if(failures.length){
  console.error(`verify-metadata-fit: ${failures.length} problem(s): a cut title or description, or a description with a phone number or "!":`);
  for(const failure of failures)console.error(` - ${failure}`);
  process.exit(1);
 }
 console.log(`verify-metadata-fit: ${checked} page renders checked; every title is at most 60 and every description at most 155 characters, with no phone number or "!".`);
}

main().catch((error)=>{console.error(error);process.exit(1);});
