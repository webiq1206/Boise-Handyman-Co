/**
 * This site's CRM delivery of a published estimate: `syncCrm()` in lib/p5/deliveryAdapter.ts posts it
 * to P5 Home Co's lead intake (owner decisions, 13, 17 and 18 November 2026). The old lead dashboard
 * is no longer called from the adapter.
 *
 * FAKE FETCH ONLY: nothing here reaches a real site. Every call is answered by a double, and a call
 * nobody expected fails the test.
 *
 * What the dashboard tests used to hold for this adapter is held here for the new destination: one
 * POST and never a second, a refused or lost post throws, an error carries no credential, address or
 * response body, an insecure destination fails before the network, and a synthetic QA record is
 * never sent. The forwarder's own rules are in the shared tests/p5-lead-intake.test.ts.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {syncCrm} from '../lib/p5/deliveryAdapter.ts';
import {ESTIMATOR_BRAND as brand} from '../lib/p5/brand.ts';
import {INTAKE_SITES} from '../lib/p5/intakePolicy.ts';
import {intakeLeadKey} from '../lib/p5/intakeDeliveryPayload.ts';
import {P5_INTAKE_URL,estimateIntakeBody} from '../lib/p5/p5LeadIntake.ts';
import {COST_CATEGORIES,calculateP5Estimate,customerEstimate,type FinancePolicy,type PricingInput,type Service} from '../lib/p5/pricing.ts';

const BRAND='Boise Handyman Co';
const DRAFT='12345678-1234-4234-8234-123456789abc';
const INTERNAL_WORD=/cost|margin|mark-?up|profit|overhead|contingenc/i;
const round2=(value:number)=>Math.round(value*100)/100;
const now=new Date('2026-09-10T12:00:00Z');
const finance:FinancePolicy={annualOverhead:420000,annualRevenue:6000000,forecastSource:'TEST FIXTURE ONLY: conservative forecast',reviewedAt:'2026-09-10',approvedBy:['Nick']};
const WORK=[
  {description:'Replace two interior doors, owner-supplied slabs',quantity:2,unit:'EA',unitCost:187.37,trade:'Windows & Doors'},
  {description:'Patch and texture drywall at the hallway',quantity:36.5,unit:'SF',unitCost:11.83,trade:'Drywall'},
  {description:'Install 20 LF owner-supplied trim',quantity:20,unit:'LF',unitCost:9.19},
  {description:'Paint the patched wall and the new trim',quantity:1,unit:'LS',unitCost:294.61,trade:'Painting'},
];

/** A priced record exactly as the estimator builds one: the real pricing engine, then the real customer view. */
function pricedRecord(extra:Record<string,unknown>={}){
  const service:Service='handyman';
  const input:PricingInput={service,revision:'fixture-revision-1',scopeSummary:'Fixture project scope',uncertainty:'low',locationProvided:true,
    lines:WORK.map((line,index)=>({id:`line-${index+1}`,category:'subcontractors',description:line.description,unit:line.unit,quantity:line.quantity,unitCost:line.unitCost,
      ...(line.trade?{trade:line.trade as never}:{}),quantitySource:'TEST signed scope',evidence:{basis:'written-quote',reference:'TEST quote',verifiedAt:'2026-09-01',validUntil:'2026-10-01'}})),
    coverage:COST_CATEGORIES.map(category=>({category,status:category==='subcontractors'?'included':'not-applicable',reason:'TEST ONLY: reviewed fixture coverage'})),
    risks:[],assumptions:[],exclusions:[],missingInformation:[],allowances:[]};
  const internal=calculateP5Estimate(input,finance,[],now);
  const customer=customerEstimate(internal,'Fixture scope summary for the customer');
  return {draftId:DRAFT,revision:2,brand:BRAND,estimator:'p5-policy',
    contact:{name:'Pat Example',email:'pat@example.invalid',phone:'(208) 555-0142'},
    scope:{text:'Fixture scope',answers:{service,address:'123 N Main St',location:'Boise'}},internal,customer,...extra};
}
/** Every number an internal estimate holds that the customer's estimate must never carry. */
function internalFigures(internal:Record<string,unknown>):number[]{
  const values:number[]=[];
  const walk=(value:unknown,key:string)=>{
    if(typeof value==='number'){if(INTERNAL_WORD.test(key)||/riskAdjusted|divisor|allocation/i.test(key))values.push(round2(value));return;}
    if(Array.isArray(value)){for(const item of value)walk(item,key);return;}
    if(value&&typeof value==='object')for(const [name,item] of Object.entries(value))walk(item,INTERNAL_WORD.test(key)||/allocation/i.test(key)?key:name);
  };
  walk(internal,'');
  return values.filter(value=>value>1);
}
const numbersIn=(value:unknown):number[]=>typeof value==='number'?[round2(value)]:Array.isArray(value)?value.flatMap(numbersIn):value&&typeof value==='object'?Object.values(value).flatMap(numbersIn):[];

const accepted=(body:unknown={ok:true,accepted:true,alert:'none'},status=201)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
type Call={url:string;init:RequestInit};
function fakeFetch(answer:(call:Call)=>Response|Promise<Response>){
  const calls:Call[]=[];
  const fetcher=(async(input:RequestInfo|URL,init?:RequestInit)=>{const call={url:String(input),init:init||{}};calls.push(call);return answer(call);}) as typeof fetch;
  return {calls,fetcher};
}
/** Run with the process-wide fetch replaced by a double, and the old dashboard settings present, then put everything back. */
async function withGlobalFetch<T>(fetcher:typeof fetch,run:()=>Promise<T>):Promise<T>{
  const keys=['LEAD_DASHBOARD_KEY','LEAD_DASHBOARD_API_URL','SYNTHETIC_QA_EMAIL_ALLOWLIST'],saved=keys.map(key=>process.env[key]),old=globalThis.fetch;
  globalThis.fetch=fetcher;
  process.env.LEAD_DASHBOARD_KEY='synthetic-dashboard-token';process.env.LEAD_DASHBOARD_API_URL='https://crm.example.invalid/api/external/leads';delete process.env.SYNTHETIC_QA_EMAIL_ALLOWLIST;
  try{return await run();}finally{globalThis.fetch=old;keys.forEach((key,i)=>{if(saved[i]===undefined)delete process.env[key];else process.env[key]=saved[i];});}
}

test('this brand is named as the P5 intake expects it',()=>{
  assert.equal(brand.id,'handyman');
  assert.equal(brand.name,BRAND);
  assert.equal(INTAKE_SITES.handyman.name,BRAND);
});

test('syncCrm posts a published estimate once to the P5 intake: p5-estimator, team_alert site, a document estimate',async()=>{
  const record=pricedRecord(),before=JSON.stringify(record);
  const {calls,fetcher}=fakeFetch(()=>accepted());
  const providerId=await syncCrm(record,'p5-outbox-key',{fetch:fetcher});
  assert.equal(providerId,`p5-intake:p5-estimator:${DRAFT}`);
  assert.equal(calls.length,1);
  assert.equal(calls[0].url,'https://p5homeco.com/api/leads/intake');
  assert.equal(calls[0].url,P5_INTAKE_URL);
  assert.equal(calls[0].init.method,'POST');
  assert.equal(calls[0].init.redirect,'error');
  assert.ok(calls[0].init.signal instanceof AbortSignal,'the post is timed');
  assert.deepEqual(calls[0].init.headers,{'Content-Type':'application/json'},'no credential and no dashboard header is sent');

  const body=JSON.parse(String(calls[0].init.body));
  const {estimate,...lead}=body;
  assert.deepEqual(lead,{
    brand:BRAND,name:'Pat Example',email:'pat@example.invalid',phone:'(208) 555-0142',
    projectType:'handyman',address:'123 N Main St',city:'Boise',message:'Fixture scope summary for the customer',
    form:'p5-estimator',sourceDetail:`p5-estimator:${DRAFT}`,external_id:`p5-estimator:${DRAFT}`,
    // The project request this estimate answers: one that began on this site.
    request_external_id:intakeLeadKey(`handyman:${DRAFT}`),
    team_alert:'site',
  });
  assert.deepEqual(body,JSON.parse(JSON.stringify(estimateIntakeBody(record,'p5-outbox-key',{brand:BRAND}))),'the shared builder, under this brand');

  // The figures: kind document, the range the customer was shown, the contract price, customer amounts only.
  assert.deepEqual(Object.keys(estimate).sort(),['base','high','kind','label','lines','low','verified']);
  assert.equal(estimate.kind,'document');
  assert.equal(estimate.verified,true);
  assert.equal(estimate.label,'Document estimate, handyman');
  assert.deepEqual([estimate.low,estimate.high],[record.customer.range!.low,record.customer.range!.high]);
  assert.equal(estimate.base,round2(record.internal.contractPrice));
  assert.equal(estimate.lines.length,WORK.length);
  assert.equal(round2(estimate.lines.reduce((sum:number,line:{amount:number})=>sum+line.amount,0)),estimate.base,'the lines add up to the contract price, to the cent');
  for(const line of estimate.lines)for(const key of Object.keys(line))assert.ok(['title','description','quantity','unit','amount','division'].includes(key),key);
  record.internal.lines.forEach((line,index)=>assert.ok(Math.abs(estimate.lines[index].amount-line.sellingAmount)<=0.01*WORK.length,'each line is its customer selling amount'));
  // By word: no field and no text names an internal figure, anywhere in the post.
  assert.doesNotMatch(String(calls[0].init.body),INTERNAL_WORD);
  // By value: no cost, contingency, overhead or profit figure of the internal record is among the numbers sent.
  const secret=new Set(internalFigures(record.internal as unknown as Record<string,unknown>));
  assert.ok(secret.size>10,'the fixture really holds internal figures');
  for(const value of numbersIn(estimate).filter(value=>value>1&&!WORK.some(line=>line.quantity===value)))assert.ok(!secret.has(value),`${value} is an internal figure`);
  // Nothing of the old dashboard body, and no team-only field.
  for(const forbidden of ['source','externalLeadId','deliveryMode','fullName','internal','team_notes','team_internal_notes'])assert.equal(forbidden in body,false,forbidden);
  assert.equal(JSON.stringify(record),before,'the durable record is not changed');
});

test('one lead per project: the estimate names the request it answers, and a revision keeps its id',async()=>{
  const {calls,fetcher}=fakeFetch(()=>accepted());
  // A project handed to this site from another keeps the id stamped at publication (manualReview.ts, submitEndpoint.ts).
  await syncCrm(pricedRecord({projectId:`p5:${DRAFT}`}),'key-1',{fetch:fetcher});
  await syncCrm(pricedRecord({projectId:`handyman:${DRAFT}`,revision:9}),'key-2',{fetch:fetcher});
  const [handed,revised]=calls.map(call=>JSON.parse(String(call.init.body)));
  assert.equal(handed.request_external_id,intakeLeadKey(`p5:${DRAFT}`));
  assert.equal(revised.request_external_id,intakeLeadKey(`handyman:${DRAFT}`));
  assert.equal(handed.external_id,revised.external_id,'the id belongs to the draft, not the revision or the outbox key');
  assert.equal(handed.brand,BRAND);
});

test('as the outbox calls it (no options): the P5 intake, never the old lead dashboard',async()=>{
  const {calls,fetcher}=fakeFetch(()=>accepted());
  const providerId=await withGlobalFetch(fetcher,()=>syncCrm(pricedRecord(),'p5-outbox-key'));
  assert.equal(providerId,`p5-intake:p5-estimator:${DRAFT}`);
  assert.equal(calls.length,1);
  assert.equal(calls[0].url,P5_INTAKE_URL);
  assert.doesNotMatch(calls[0].url,/crm\.example\.invalid|leads\.boiseremodeling\.co/);
  const headers=new Headers(calls[0].init.headers);
  assert.equal(headers.get('Authorization'),null);
  assert.equal(headers.get('Idempotency-Key'),null);
  assert.doesNotMatch(String(calls[0].init.body),/synthetic-dashboard-token/);
});

test('a refused or lost post throws a short error, after one post and never a second',async()=>{
  const secret='SECRET-RESPONSE-BODY pat@example.invalid https://user:password@private';
  const timeout=()=>{const error=new Error('The operation was aborted due to timeout');error.name='TimeoutError';throw error;};
  const cases:[string,(call:Call)=>Response,RegExp][]=[
    ['refused',()=>new Response(secret,{status:500}),/^P5 intake refused the estimate \(HTTP 500\)$/],
    ['conflict',()=>accepted({duplicate:true,note:secret},409),/^P5 intake refused the estimate \(HTTP 409\)$/],
    ['too large',()=>accepted({ok:false,error:secret},413),/^P5 intake refused the estimate \(HTTP 413\)$/],
    ['rejected',()=>accepted({ok:false,errors:[secret]},422),/^P5 intake refused the estimate \(HTTP 422\)$/],
    ['rate limited',()=>accepted({ok:false,error:secret},429),/^P5 intake refused the estimate \(HTTP 429\)$/],
    ['not accepted',()=>accepted({ok:false,error:secret},200),/^P5 intake did not accept the estimate$/],
    ['not json',()=>new Response(`<html>${secret}</html>`,{status:200}),/^P5 intake answer was not valid JSON$/],
    ['unreachable',()=>{throw new Error(`connect ECONNREFUSED ${secret}`);},/^P5 intake could not be reached; the estimate was not confirmed$/],
    ['timed out',timeout,/^P5 intake did not answer in time; the estimate was not confirmed$/],
  ];
  for(const [name,answer,expected] of cases){
    const {calls,fetcher}=fakeFetch(answer);
    const error=await syncCrm(pricedRecord(),'p5-outbox-key',{fetch:fetcher}).then(()=>null,(e:Error)=>e);
    assert.ok(error instanceof Error,`${name}: the outbox must see a failure`);
    assert.match(error.message,expected,name);
    assert.ok(error.message.length<120&&!/SECRET|password|private|@/.test(error.message),`${name}: no credential, address or response body`);
    assert.equal(calls.length,1,`${name}: one post, no reconciliation read and no second post`);
  }
});

test('never sent: a synthetic QA record, a record nobody could be reached about, an insecure destination',async()=>{
  const {calls,fetcher}=fakeFetch(()=>accepted());
  for(const qa of [{contact:{name:'[QA] Acceptance',email:'qa@example.invalid',phone:''}},{contact:{name:'SYNTHETIC QA run',email:'qa@example.invalid',phone:''}}])
    await assert.rejects(syncCrm(pricedRecord(qa),'p5-outbox-key',{fetch:fetcher}),/synthetic QA estimate is never forwarded/);
  await assert.rejects(syncCrm(pricedRecord({contact:{name:'Pat Example',email:'',phone:''}}),'p5-outbox-key',{fetch:fetcher}),/email address or a phone number/);
  for(const url of ['http://p5homeco.com/api/leads/intake','https://user:password@p5homeco.com/api/leads/intake','not-a-url'])
    await assert.rejects(syncCrm(pricedRecord(),'p5-outbox-key',{fetch:fetcher,url}),/credential-free HTTPS endpoint/);
  assert.equal(calls.length,0,'nothing was posted');
});

test('figures that cannot be used: the lead still goes, without estimate and without team_alert, so P5 sends its usual email',async()=>{
  const {calls,fetcher}=fakeFetch(()=>accepted());
  await syncCrm(pricedRecord({customer:{summary:'Held for review',range:null}}),'p5-outbox-key',{fetch:fetcher});
  const body=JSON.parse(String(calls[0].init.body));
  assert.equal(body.form,'p5-estimator');
  assert.equal(body.brand,BRAND);
  assert.equal('estimate' in body,false);
  assert.equal('team_alert' in body,false);
});

test('wiring: the forwarder is loaded when called, and the adapter no longer knows the lead dashboard',()=>{
  const adapter=readFileSync(new URL('../lib/p5/deliveryAdapter.ts',import.meta.url),'utf8');
  assert.match(adapter,/await import\('\.\/p5LeadIntake\.ts'\)/);
  // A static import would break the shared tests/p5-intake-reply-to.test.ts, which runs this file with a fixed dependency list.
  assert.doesNotMatch(adapter,/^import[^\n]*p5LeadIntake/m);
  assert.match(adapter,/forwardEstimateToP5\(record,key,\{[^}]*brand:brand\.name\}\)/);
  assert.doesNotMatch(adapter,/process\.env\.LEAD_DASHBOARD|crmUrl|keyedCrm|boundedCrmPayload|deliverKeyedCrm/);
  assert.equal(adapter.includes(String.fromCharCode(0x2014)),false,'no em dash');
});
