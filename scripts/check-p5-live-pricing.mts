import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {query} from '../lib/p5/database';
import {openAiPricingRequestEnvelope,priceCompleteScope,requestPricingWith,type PricingRequest} from '../lib/p5/scopePricing';
import {ESTIMATOR_BRAND as brand} from '../lib/p5/brand';
import type {EstimatorConfiguration} from '../lib/p5/costBook';
import type {ReviewedScope} from '../lib/p5/scope';
import {beginQualificationCall,dollarsToMicrousd,markQualificationUnknown,prepareQualificationBudget,qualificationRequestKey,reserveQualificationCall,settleQualificationCall} from '../lib/p5/providerBudget';

// Opt-in paid inference with synthetic scope and read-only approved pricing.
// No draft, rate, lead, CRM, outbox or email write is called by this script.
if(process.env.P5_RUN_LIVE_PRICING!=='true')throw new Error('Explicit live pricing test authorization is required.');
const fingerprint=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
async function main(){
 const runId=process.env.P5_LIVE_PRICING_RUN_ID||'';
 const allowance=dollarsToMicrousd(process.env.P5_LIVE_PRICING_ALLOWANCE_DOLLARS||'');
 const perCallCap=dollarsToMicrousd(process.env.P5_LIVE_PRICING_RESERVE_PER_CALL_DOLLARS||'');
 if(perCallCap>allowance)throw new Error('The per-call reservation cap exceeds the documented remaining allowance.');
 await prepareQualificationBudget(runId,allowance);
 const integrated=Boolean(process.env.AI_INTEGRATIONS_OPENAI_API_KEY&&process.env.AI_INTEGRATIONS_OPENAI_BASE_URL);
 const openai=Boolean(integrated?process.env.AI_INTEGRATIONS_OPENAI_API_KEY:process.env.OPENAI_API_KEY);
 const endpointKind=integrated?'replit-managed-openai':'direct-openai';
 const endpointFingerprint=fingerprint(integrated?process.env.AI_INTEGRATIONS_OPENAI_BASE_URL:(process.env.OPENAI_BASE_URL||'https://api.openai.com/v1'));
  const provider='openai' as const;
  if(!openai)throw new Error('The approved OpenAI qualification provider is not configured.');
  if(process.env.P5_PRICING_PROVIDER==='anthropic')throw new Error('This qualification is OpenAI-only so every provider request has one pre-reserved charge boundary.');
 const [policy]=await query("SELECT payload FROM p5_estimator_policy WHERE id='current'");
 assert.ok(policy?.payload?.planningCatalog?.rates?.length,'The approved catalog must be populated');
 const configuration=policy.payload as EstimatorConfiguration,before=fingerprint(configuration),reports:any[]=[];
 const services=brand.services as readonly string[],cabinet=String(brand.id)==='cabinet';
 const baseService=services.includes('handyman')?'handyman':services.includes('kitchen')?'kitchen':services[0];
  const selected=process.env.P5_LIVE_PRICING_SCENARIO||'mapping';assert.equal(selected,'mapping','Only the tool-free approved-rate mapping qualification is permitted.');
 await mkdir('p5-verification',{recursive:true});
  for(const scenario of ['mapping']){
  const missing=scenario==='missing';
  const text=missing?'Supply 100 linear feet of standard paint-grade wood crown moulding for kitchen cabinets in Boise, Idaho. Materials only; owner installs it. Price the moulding by linear foot using a preliminary average material cost for the area.':cabinet?'Install 20 linear feet of owner-supplied, assembled paint-grade Shaker base cabinets on the first floor of Building Alpha. Installation labor only, including normal leveling, fastening and adjustment.':'Fit and fasten 100 linear feet of paint-grade interior base moulding on the first floor of Building Alpha. Baseboard installation labor only. Owner supplies all materials.';
  const instructions=missing?'Price only the 100 linear feet of crown moulding material. Exclude installation, painting, cabinet casework and all other work. Use sourced regional average material costs per linear foot, or a clearly labeled broader benchmark. Do not shop suppliers or require an exact SKU.':'Price only the specified first-floor installation labor in Building Alpha. Owner supplies all materials. Exclude all plumbing, electrical and second-floor work. Do not charge owner-supplied materials.';
  const scope:ReviewedScope={text,answers:{service:missing&&services.includes('cabinet-product')?'cabinet-product':cabinet?'cabinet-install':baseService,location:'Boise, Idaho',estimatingInstructions:instructions,...(cabinet&&!missing?{cabinetRoom:'kitchen',cabinetBaseLf:'20',cabinetUpperLf:'0',cabinetTallLf:'0'}:{})},extraction:null,uploads:[],reviewedAt:new Date().toISOString(),corrections:[]};
  const config=structuredClone(configuration);
  // A deliberately missing material category in an in-memory test copy forces
  // the research path. The owner's saved185-rate catalog remains untouched.
  if(missing)config.planningCatalog!.rates=config.planningCatalog!.rates.filter(rate=>rate.type!=='Material');
   const stages:any[]=[];const request:PricingRequest=async(instructions,input,search,remaining)=>{
     if(search)throw new Error('The approved-rate mapping qualification cannot use provider tools or research.');
     const model=process.env.P5_PRICING_OPENAI_MODEL||process.env.P5_SCOPE_OPENAI_MODEL||'gpt-4.1';
     const serviceTier='default' as const,maxOutputTokens=1500;
     const envelope=openAiPricingRequestEnvelope(instructions,input,search,{serviceTier,maxOutputTokens});
     assert.equal(envelope.model,model,'The bounded request model must match the reserved model.');
     const requestBytes=Buffer.byteLength(JSON.stringify(envelope.body));
     assert.ok(requestBytes<=272000,'Qualification stopped before provider contact: the request exceeds the standard-rate token threshold.');
     const inputTokenUpperBound=requestBytes;
     const reservedMicrousd=Math.ceil(inputTokenUpperBound*6.875+maxOutputTokens*33);
     assert.ok(reservedMicrousd<=perCallCap,'Qualification stopped before provider contact: the conservative per-call bound exceeds its cap.');
     const identity=qualificationRequestKey(runId,provider,model,{scenario,instructions,input,search});
     const reservation=await reserveQualificationCall({runId,provider,model,...identity,reservedMicrousd});
    await beginQualificationCall(reservation.idempotencyKey);
      const start=performance.now();try{const result=await requestPricingWith(provider,instructions,input,search,remaining,{serviceTier,maxOutputTokens});
       if(result.provider!==provider||result.model!==model||result.providerRequestIds?.length!==1||!result.responseModel||result.serviceTier!==serviceTier)throw new Error('Qualification provider identity or service tier was ambiguous.');
       assert.ok(result.responseModel===model||result.responseModel.startsWith(`${model}-`),'The returned model did not match the requested model identity.');
       assert.ok(result.usage&&result.usage.inputTokens>0&&result.usage.outputTokens>0,'Qualification usage was absent.');
       assert.ok(result.usage.inputTokens<=inputTokenUpperBound&&result.usage.outputTokens<=maxOutputTokens,'Returned usage exceeded the pre-reserved bounds.');
       const usageUpperBoundMicrousd=Math.ceil(result.usage.inputTokens*6.875+result.usage.outputTokens*33);
       assert.ok(usageUpperBoundMicrousd<=reservation.reservedMicrousd,'Actual bounded usage exceeded the reservation.');
       await settleQualificationCall({idempotencyKey:reservation.idempotencyKey,provider,model,requestHash:identity.requestHash,providerRequestId:result.providerRequestIds[0]});
       stages.push({provider,requestedModel:model,returnedModel:result.responseModel,requestedServiceTier:serviceTier,returnedServiceTier:result.serviceTier,providerRequestId:result.providerRequestIds[0],search,milliseconds:Math.round(performance.now()-start),sourceUrls:result.sourceUrls,value:result.value,usage:result.usage,requestBytes,inputTokenUpperBound,maxOutputTokens,reservationMicrousd:reservation.reservedMicrousd,usageUpperBoundMicrousd});
       return result;
      }catch(error){await markQualificationUnknown(runId,reservation.idempotencyKey);stages.push({provider,requestedModel:model,requestedServiceTier:serviceTier,search,milliseconds:Math.round(performance.now()-start),error:error instanceof Error?error.message:'failed',charge:'unknown'});throw error;}finally{await writeFile(`p5-verification/live-pricing-${scenario}-stages.json`,JSON.stringify(stages,null,2));}
  };
  const start=performance.now();const result=await priceCompleteScope(scope,config,request);const internal=result.internal as any;
  const issues=internal.scopePricing?.issues||[];const lines=internal.lines||[];
  reports.push({scenario,scope,elapsedMs:Math.round(performance.now()-start),stages,result,passed:Boolean(result.customer.range)&&lines.length>0&&lines.every((line:any)=>line.quantity>0&&line.cost>0)&&issues.length===0});
  await writeFile(`p5-verification/live-pricing-${scenario}-report.json`,JSON.stringify(reports.at(-1),null,2));
 }
 const [after]=await query("SELECT payload FROM p5_estimator_policy WHERE id='current'");
  const report={synthetic:true,brand:brand.id,endpointKind,endpointFingerprint,approvedRateCount:configuration.planningCatalog!.rates.length,approvedConfigurationUnchanged:before===fingerprint(after.payload),businessWrites:0,reports};
 await mkdir('p5-verification',{recursive:true});await writeFile('p5-verification/live-pricing-report.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({brand:brand.id,approvedRateCount:report.approvedRateCount,unchanged:report.approvedConfigurationUnchanged,scenarios:reports.map(r=>({scenario:r.scenario,passed:r.passed,range:r.result.customer.range,elapsedMs:r.elapsedMs,issues:r.result.internal.scopePricing?.issues}))}));
 assert.ok(report.approvedConfigurationUnchanged,'The approved configuration must not change');assert.ok(reports.every(r=>r.passed),'Every synthetic scope must have a complete positive range');
}
main().then(()=>process.exit(0)).catch(error=>{console.error(error instanceof Error?error.message:'Live pricing check failed');process.exit(1);});
