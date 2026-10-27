import test from 'node:test';
import assert from 'node:assert/strict';
import {buildP5IntakeBody,forwardConsultationToP5Intake} from '../server/services/p5IntakeBridge';
const contact={name:'Isolated fixture',email:'fixture@example.com',inquiryId:'same-request'};
test('actual supplied paid evidence reaches intake without manufactured IDs',()=>{
 const b=buildP5IntakeBody({...contact,attribution:{utm_source:'google',utm_medium:'cpc',utm_campaign:'cabinet'}});
 assert.equal(b.source,'Paid Search');assert.equal(b.utm_campaign,'cabinet');assert.equal(b.originalCampaign,'cabinet');assert.equal(b.gclid,undefined);
});
test('explicit organic differs from unknown and invalid data',()=>{
 assert.equal(buildP5IntakeBody({...contact,attribution:{utm_medium:'organic'}}).source,'Organic Website');
 for(const attribution of [undefined,{}, {utm_medium:'',gclid:'email@private.example'}, {referrer:'https://google.com/private?q=person'}]){
  const b=buildP5IntakeBody({...contact,attribution});assert.equal(b.source,'Other');assert.equal(b.gclid,undefined);assert.equal(b.referrer,undefined);
 }
});
test('first and latest touch remain distinct and input is immutable',()=>{
 const attribution=Object.freeze({first_utm_campaign:'original',first_gclid:'original-id',utm_campaign:'return',utm_medium:'organic'});
 const b=buildP5IntakeBody({...contact,attribution});assert.equal(b.source,'Organic Website');assert.equal(b.originalCampaign,'original');assert.equal(b.first_gclid,'original-id');assert.equal(b.gclid,undefined);assert.equal(b.utm_campaign,'return');
});
test('retry preserves source evidence and exact external lead identity',async()=>{
 const input={...contact,attribution:{gclid:'actual-supplied-id'}};const bodies:string[]=[];
 const transport=async(_url:string,init:RequestInit)=>{bodies.push(String(init.body));return new Response('{}',{status:200});};
 await forwardConsultationToP5Intake(input,transport);await forwardConsultationToP5Intake(input,transport);
 assert.equal(bodies.length,2);assert.equal(bodies[0],bodies[1]);assert.ok(JSON.parse(bodies[0]).externalLeadId.endsWith(':same-request'));
});
test('synthetic markers cannot produce paid attribution',()=>{
 for(const input of [{...contact,email:'qa@example.invalid',attribution:{gclid:'fixture'}},{...contact,attribution:{gclid:'fixture',utm_campaign:'qa'}},{...contact,attribution:{gclid:'fixture',first_utm_campaign:'synthetic-test'}}]){
  const b=buildP5IntakeBody(input);assert.equal(b.source,'Other');assert.equal(b.gclid,undefined);assert.equal(b.originalCampaign,undefined);
 }
});
test('only bounded existing token fields propagate, no URL or personal payload',()=>{
 const b=buildP5IntakeBody({...contact,attribution:{gclid:'x'.repeat(301),landing_page:'/contact?email=private',phone:'private',utm_source:'google',utm_content:'safe_token'}});
 assert.equal(b.gclid,undefined);assert.equal(b.landing_page,undefined);assert.equal(b.phone,undefined);assert.equal(b.utm_content,'safe_token');
});
