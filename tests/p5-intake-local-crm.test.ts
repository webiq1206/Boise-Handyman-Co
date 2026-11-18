/**
 * This site's unpriced project requests on their way to P5 Home Co's lead system (owner decisions,
 * 13, 17 and 18 November 2026): the `crm` channel of lib/p5/intakeDeliveryRuntime.ts is the shared
 * P5 lead transport, and lib/p5/intakeCrmValidation.ts is the check it runs before any post.
 *
 * FAKE FETCH ONLY: nothing here reaches a real site. No database, no email transport. The runtime
 * builds its transport with no fetch seam, so the process-wide fetch is replaced by a double for the
 * length of each test, and a call nobody expected fails the test.
 *
 * The transport's own rules (retry inside the delivery worker, the bounded summary, campaign fields)
 * are held by the shared tests/p5-lead-intake.test.ts.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runtimeIntakeTransports} from '../lib/p5/intakeDeliveryRuntime.ts';
import {validateIntakeLocalCrm} from '../lib/p5/intakeCrmValidation.ts';
import {canonicalReviewTransport} from '../lib/p5/canonicalReviewTransport.ts';
import {P5_INTAKE_URL,P5_LEAD_RETRY_WINDOW_MS,PROJECT_REQUEST_LEADS_SINCE,p5LeadIntakeTransport,projectRequestHold,projectRequestIntakeBody} from '../lib/p5/p5LeadIntake.ts';
import {intakeDeliveryEnvelope,intakeLeadKey} from '../lib/p5/intakeDeliveryPayload.ts';
import {INTAKE_RUNTIME_PROOF} from '../lib/p5/intakeDeliveryPolicy.ts';
import {emptyIntakeDetails,type IntakeSnapshot} from '../lib/p5/intakeContract.ts';
import {intakeSite,routeIntake} from '../lib/p5/intakePolicy.ts';
import {ESTIMATOR_BRAND} from '../lib/p5/brand.ts';

const site=intakeSite(ESTIMATOR_BRAND.id);
assert.equal(site,'handyman','This brand is the handyman intake site');
const id='12345678-1234-4234-8234-123456789abc',digest='a'.repeat(64);
const INTERNAL_WORD=/cost|margin|mark-?up|profit|overhead|contingenc/i;
function snapshot(service='handyman',extra:Partial<IntakeSnapshot>={}):IntakeSnapshot{
 return {schema:1,projectId:`handyman:${id}`,reference:'HMN-4F7K2Q',draftId:id,originSite:'handyman',currentSite:'handyman',revision:1,contextVersion:0,savedAt:'2099-01-02T12:00:00.000Z',
  contact:{name:'Fictional Person',email:'customer@example.invalid',phone:'2085550100',preferredContact:'email'},
  details:{...emptyIntakeDetails(),desiredOutcome:'Fictional outcome',workContext:'Fictional existing home',transcript:[{id:'fictional-message',role:'user',text:'Fictional conversation',at:1,files:[]}]},
  scope:{text:'Fictional whole scope: rehang two doors and patch the hallway wall.',answers:{service,address:'123 N Main St',location:'Boise'},extraction:null,uploads:[]},
  routing:routeIntake('handyman',service),unresolved:[],...extra} as IntakeSnapshot;
}
const envelope=(request:IntakeSnapshot,channel:'crm'|'team'='crm')=>intakeDeliveryEnvelope(request,channel,digest);

const accepted=(body:unknown={ok:true,accepted:true,alert:'none'},status=201)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
type Call={url:string;init:RequestInit};
const ENV=['P5_CRM_DELIVERY','P5_REQUEST_LEADS_SINCE','P5_CANONICAL_REVIEW_TOKEN','LEAD_DASHBOARD_KEY','LEAD_DASHBOARD_API_URL','SYNTHETIC_QA_EMAIL_ALLOWLIST'];
/** Run with the given settings and a fetch double in place of the process-wide fetch, then put everything back. */
async function withSite<T>(settings:Record<string,string>,answer:(call:Call)=>Response,run:(calls:Call[])=>Promise<T>):Promise<T>{
 const saved=ENV.map(key=>process.env[key]),old=globalThis.fetch,calls:Call[]=[];
 for(const key of ENV)delete process.env[key];
 Object.assign(process.env,settings);
 globalThis.fetch=(async(input:RequestInfo|URL,init?:RequestInit)=>{const call={url:String(input),init:init||{}};calls.push(call);return answer(call);}) as typeof fetch;
 try{return await run(calls);}finally{globalThis.fetch=old;ENV.forEach((key,i)=>{if(saved[i]===undefined)delete process.env[key];else process.env[key]=saved[i];});}
}
const unexpected=():Response=>{throw new Error('unexpected network call');};

test('the crm channel of this site is the P5 lead transport, and it is crm-disabled without the variable',async()=>{
 const s=snapshot();
 // Not set, or set to anything but "on": disabled, and a send refuses before any post.
 for(const settings of [{},{P5_CRM_DELIVERY:'off'},{P5_CRM_DELIVERY:'true'},{P5_CRM_DELIVERY:'ON'}] as Record<string,string>[]){
  await withSite(settings,unexpected,async calls=>{
   const {crm}=await runtimeIntakeTransports();
   assert.equal(await crm.readiness(s),'crm-disabled',JSON.stringify(settings));
   await assert.rejects(crm.send(envelope(s)),/^Error: crm-disabled$/);
   assert.equal(calls.length,0);
  });
 }
 // The old settings do not turn it on, and it does not wait on the canonical receiver's gate.
 await withSite({P5_CANONICAL_REVIEW_TOKEN:'offline-only',LEAD_DASHBOARD_KEY:'offline-only'},unexpected,async()=>{
  assert.equal(await (await runtimeIntakeTransports()).crm.readiness(s),'crm-disabled');
 });
 await withSite({P5_CRM_DELIVERY:'on'},unexpected,async calls=>{
  const {crm,customer,team}=await runtimeIntakeTransports();
  assert.equal(await crm.readiness(s),null,'on with the one existing setting, no token and no runtime proof');
  assert.equal(INTAKE_RUNTIME_PROOF.crm,null,'the canonical receiver gate is untouched and still closed');
  // The shared P5 lead transport, exactly: its retry contract, its identity, its facts-only check.
  const reference=p5LeadIntakeTransport({enabled:true});
  assert.equal(crm.identityScope,reference.identityScope);
  assert.equal(crm.retryWindowMs,P5_LEAD_RETRY_WINDOW_MS);
  assert.equal(crm.validate,projectRequestHold);
  assert.equal(crm.prepare,undefined);
  // Not the canonical review transport, whatever its token or proof.
  for(const [token,proof] of [['',null],['offline-only',null],['offline-only','offline-only']] as [string,string|null][])
   assert.notEqual(crm.identityScope,canonicalReviewTransport({enabled:true,token,proof}).identityScope);
  // Requests saved before the lead system began taking them stay out, so old ones do not arrive all at once.
  assert.equal(await crm.readiness(snapshot('handyman',{savedAt:'2026-11-17T23:59:59.000Z'})),'crm-disabled');
  assert.equal(await crm.readiness(snapshot('handyman',{savedAt:PROJECT_REQUEST_LEADS_SINCE})),null);
  // The email channels are as they were.
  assert.equal(customer,team);
  assert.deepEqual([team.retryWindowMs,team.identityScope],[0,'handyman-email-no-automatic-replay']);
  assert.equal(calls.length,0,'readiness never calls the network');
 });
 // P5_REQUEST_LEADS_SINCE names another moment on purpose.
 await withSite({P5_CRM_DELIVERY:'on',P5_REQUEST_LEADS_SINCE:'2026-11-01T00:00:00.000Z'},unexpected,async()=>{
  assert.equal(await (await runtimeIntakeTransports()).crm.readiness(snapshot('handyman',{savedAt:'2026-11-10T12:00:00.000Z'})),null);
 });
});

test('a project request is posted once to the P5 intake: p5-project-request, team_alert site, this site\'s routing, no price',async()=>{
 const request=envelope(snapshot());
 await withSite({P5_CRM_DELIVERY:'on',LEAD_DASHBOARD_KEY:'synthetic-dashboard-token',P5_CANONICAL_REVIEW_TOKEN:'synthetic-canonical-token'},()=>accepted(),async calls=>{
  const {crm}=await runtimeIntakeTransports();
  assert.equal(crm.validate!(request),null);
  const providerId=await crm.send(request);
  assert.equal(providerId,`p5-intake:${request.leadKey}`);
  assert.equal(calls.length,1);
  assert.equal(calls[0].url,'https://p5homeco.com/api/leads/intake');
  assert.equal(calls[0].url,P5_INTAKE_URL);
  assert.equal(calls[0].init.method,'POST');
  assert.equal(calls[0].init.redirect,'error');
  assert.deepEqual(calls[0].init.headers,{'Content-Type':'application/json'},'no credential is sent');
  assert.doesNotMatch(String(calls[0].init.body),/synthetic-dashboard-token|synthetic-canonical-token/);
  const body=JSON.parse(String(calls[0].init.body));
  const {message,...rest}=body;
  assert.deepEqual(rest,{
   brand:'Boise Handyman Co',name:'Fictional Person',email:'customer@example.invalid',phone:'2085550100',
   projectType:'handyman',address:'123 N Main St',city:'Boise',form:'p5-project-request',request_kind:'quote',contact_preference:'email',
   sourceDetail:`p5-project-request:${id}`,external_id:intakeLeadKey(`handyman:${id}`),team_alert:'site',
  });
  assert.deepEqual(body,JSON.parse(JSON.stringify(projectRequestIntakeBody(request))),'the shared builder');
  // The summary names this site and its staff record, and says there is no price.
  assert.match(message,/^Project request HMN-4F7K2Q, revision 1, sent from boisehandyman\.co\. No price has been given\.$/m);
  assert.match(message,/^Team: Boise Handyman Co$/m);
  assert.match(message,new RegExp(`^Full request and files \\(staff sign-in\\): https://boisehandyman\\.co/api/admin/p5-intake\\?draftId=${id}&revision=1$`,'m'));
  // No price: no estimate, no figure field, no dollar amount, and no internal figure by name.
  for(const forbidden of ['estimate','low','high','base','amount','lines','total','team_notes','team_internal_notes'])assert.equal(forbidden in body,false,forbidden);
  assert.doesNotMatch(String(calls[0].init.body),/\$\s?\d/);
  assert.doesNotMatch(String(calls[0].init.body),INTERNAL_WORD);
 });
});

test('brand routing: work that belongs to this site is filed under it, and other work under the team it was routed to',()=>{
 for(const [service,brand] of [['handyman','Boise Handyman Co'],['re10','Boise Handyman Co'],['kitchen','Boise Remodeling Co'],['bathroom','Boise Remodeling Co'],['addition','Boise Construction Co'],['cabinet-install','Boise Cabinet Co']] as const){
  const body=projectRequestIntakeBody(envelope(snapshot(service)));
  assert.equal(body.brand,brand,service);
  assert.equal(body.form,'p5-project-request');
  assert.equal(body.team_alert,'site');
  assert.match(String(body.message),/sent from boisehandyman\.co\./,'whichever team it is filed under, it came from this site');
 }
 // One lead per project: every revision of a request carries the same id.
 assert.equal(projectRequestIntakeBody(envelope(snapshot('handyman',{revision:4}))).external_id,projectRequestIntakeBody(envelope(snapshot())).external_id);
});

test('a refused post throws a short error after one post, so the delivery worker decides about a retry',async()=>{
 const secret='SECRET-RESPONSE-BODY customer@example.invalid';
 for(const [answer,expected] of [
  [()=>new Response(secret,{status:500}),/^P5 intake refused the project request \(HTTP 500\)$/],
  [()=>accepted({ok:false,errors:[secret]},422),/^P5 intake refused the project request \(HTTP 422\)$/],
  [()=>accepted({ok:false,error:secret},200),/^P5 intake did not accept the project request$/],
  [():Response=>{throw new Error(`connect ECONNREFUSED ${secret}`);},/^P5 intake could not be reached; the project request was not confirmed$/],
 ] as [(call:Call)=>Response,RegExp][]){
  await withSite({P5_CRM_DELIVERY:'on'},answer,async calls=>{
   const error=await (await runtimeIntakeTransports()).crm.send(envelope(snapshot())).then(()=>null,(e:Error)=>e);
   assert.ok(error instanceof Error);
   assert.match(error.message,expected);
   assert.ok(!/SECRET|@/.test(error.message),'no response body and no address in the error');
   assert.equal(calls.length,1);
  });
 }
});

test('held before any send: a synthetic request, one nobody can be reached about, and an envelope that is not this request',async()=>{
 const s=snapshot();
 assert.equal(validateIntakeLocalCrm(envelope(s)),null);
 assert.equal(validateIntakeLocalCrm(envelope({...s,contact:{name:'Fictional Phone Person',email:'',phone:'2085550100',preferredContact:'phone'}})),null);
 assert.equal(validateIntakeLocalCrm(envelope(s,'team')),'payload-review');
 assert.equal(validateIntakeLocalCrm({...envelope(s),leadKey:intakeLeadKey(`handyman:${id.replace('1','2')}`)}),'payload-review');
 assert.equal(validateIntakeLocalCrm({...envelope(s),request:undefined}),'payload-review');
 assert.equal(validateIntakeLocalCrm(envelope({...s,contact:{...s.contact,email:'',phone:''}})),'contact-review');
 // A synthetic QA request never becomes a lead, whatever mailbox it names and whatever the allowlist says.
 const qa={...s,contact:{...s.contact,name:'[QA] Fictional Person',email:'fictional@unapproved.invalid'}};
 for(const allowlist of ['','fictional@unapproved.invalid'])await withSite({P5_CRM_DELIVERY:'on',SYNTHETIC_QA_EMAIL_ALLOWLIST:allowlist},unexpected,async calls=>{
  assert.equal(validateIntakeLocalCrm(envelope(qa)),'synthetic-suppressed');
  const {crm}=await runtimeIntakeTransports();
  assert.equal(crm.validate!(envelope(qa)),'synthetic-suppressed');
  await assert.rejects(crm.send(envelope(qa)),/^Error: synthetic-suppressed$/);
  await assert.rejects(crm.send(envelope(s,'team')),/^Error: payload-review$/);
  assert.equal(calls.length,0,'nothing was posted');
 });
 // The site's check is the transport's check: one rule, not two.
 for(const candidate of [envelope(s),envelope(s,'team'),envelope(qa),envelope({...s,contact:{...s.contact,email:'',phone:''}})])
  assert.equal(validateIntakeLocalCrm(candidate),projectRequestHold(candidate));
});

test('wiring: the runtime names the P5 lead transport and no longer the canonical one, which stays as it was',()=>{
 const read=(file:string)=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
 const runtime=read('lib/p5/intakeDeliveryRuntime.ts');
 assert.match(runtime,/const crm=p5LeadIntakeTransport\(\{enabled:process\.env\.P5_CRM_DELIVERY==='on',since:process\.env\.P5_REQUEST_LEADS_SINCE\}\);/);
 assert.match(runtime,/return \{customer:email,team:email,crm\};/);
 assert.doesNotMatch(runtime,/^import[^\n]*canonicalReviewTransport/m);
 assert.doesNotMatch(runtime,/canonicalReviewTransport\(|process\.env\.P5_CANONICAL_REVIEW_TOKEN|LEAD_DASHBOARD|projectReviewTransport/);
 // The canonical transport and its gate are left alone: still present, still closed.
 assert.match(read('lib/p5/canonicalReviewTransport.ts'),/export function canonicalReviewTransport\(/);
 assert.match(read('lib/p5/intakeDeliveryPolicy.ts'),/INTAKE_RUNTIME_PROOF:\{email:string\|null;crm:string\|null\}=\{email:'fleet-release-2026-10-08',crm:null\}/);
 for(const file of ['lib/p5/intakeDeliveryRuntime.ts','lib/p5/intakeCrmValidation.ts'])assert.equal(read(file).includes(String.fromCharCode(0x2014)),false,`${file}: no em dash`);
});
