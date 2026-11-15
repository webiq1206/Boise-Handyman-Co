import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {checkedEmailSender} from '../lib/emailDelivery.ts';
import {ESTIMATOR_BRAND} from '../lib/p5/brand.ts';

function fixture(replies:any[]) {
  const calls:{body:any;options:any}[]=[];
  const send=checkedEmailSender(async(body:any,options:any)=>{
    calls.push({body,options});
    const reply=replies.shift();
    if(reply instanceof Error)throw reply;
    return reply;
  },'p5homeco.com');
  const exports:Record<string,any>={};
  const dependencies:Record<string,unknown>={
    './emailReplyTo.ts':{safeEmailReplyTo:(value:string,fallback:string)=>value||fallback},
    './brand':{ESTIMATOR_BRAND},
    './boundedCrmPayload':{buildCrmPayload:()=>({})},
    './keyedCrm':{crmIdentity:()=>({}),deliverKeyedCrm:async()=>{throw new Error('Unexpected CRM call');}},
    '../../server/services/emailTransport':{getUncachableEmailClient:async()=>({client:{emails:{send}}})},
    '../../server/services/emailLayout':{getAdminRecipientEmails:async()=>[ESTIMATOR_BRAND.email]},
  };
  vm.runInNewContext(ts.transpileModule(readFileSync('lib/p5/deliveryAdapter.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{
    exports,require:(name:string)=>{assert.ok(Object.hasOwn(dependencies,name),name);return dependencies[name];},
    Buffer,console,process:{env:{}},Set,
  });
  return {calls,sendEmail:exports.sendEmail};
}
const input={to:'fictional@example.invalid',subject:'Offline fixture',text:'Offline fixture',attachments:[],key:'offline-fixture'};

test('known provider rejection retries once with the same provider key and accepts only the successful ID',async()=>{
  const f=fixture([{error:{statusCode:503,message:'unavailable'}},{data:{id:'accepted-fixture'},error:null}]);
  assert.equal(await f.sendEmail({...input,suppressFailureAlert:true}),'accepted-fixture');
  assert.equal(f.calls.length,2);
  assert.deepEqual(f.calls.map(call=>call.options.idempotencyKey),[input.key,input.key]);
  assert.equal(f.calls.every(call=>call.body.to===input.to),true);
});

test('outbox owns its terminal alert and adapter does not dispatch a second alert',async()=>{
  const f=fixture([{error:{statusCode:422,message:'invalid recipient'}}]);
  await assert.rejects(()=>f.sendEmail({...input,suppressFailureAlert:true}));
  assert.equal(f.calls.length,1);
  assert.equal(f.calls[0].body.to,input.to);
});

test('direct callers retain one deduped terminal failure alert',async()=>{
  const f=fixture([{error:{statusCode:422,message:'invalid recipient'}},{data:{id:'alert-accepted'},error:null},{error:{statusCode:422,message:'invalid recipient'}}]);
  await assert.rejects(()=>f.sendEmail(input));
  await assert.rejects(()=>f.sendEmail(input));
  assert.equal(f.calls.filter(call=>call.body.to==='hello@p5homeco.com').length,1);
  assert.equal(f.calls.filter(call=>call.body.to===input.to).length,2);
});

test('an acknowledgement without a provider ID is not retried as known rejection',async()=>{
  const f=fixture([{data:null,error:null}]);
  await assert.rejects(()=>f.sendEmail({...input,suppressFailureAlert:true}));
  assert.equal(f.calls.length,1);
});
