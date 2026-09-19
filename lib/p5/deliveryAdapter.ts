import { getUncachableEmailClient } from "../../server/services/emailTransport";
import { getAdminRecipientEmails,formatFromAddress } from "../../server/services/emailLayout";
import { ESTIMATOR_BRAND as brand } from "./brand";
const CRM_BODY_LIMIT=90*1024;
const clamp=(value:unknown,limit:number)=>{
  const text=String(value??"");
  return text.length<=limit?text:`${text.slice(0,limit-20)}\n...[truncated]`;
};
export function buildCrmPayload(record:any,key:string){
  const range=record.customer.range;
  const base={fullName:clamp(record.contact.name,255),email:clamp(record.contact.email,255),phone:clamp(record.contact.phone,50),
    source:clamp(brand.domain,100),externalLeadId:key,inquiryId:record.draftId,
    propertyAddress:record.scope.answers.address?clamp(record.scope.answers.address,500):undefined,
    city:record.scope.answers.location?clamp(record.scope.answers.location,100):undefined,
    projectTypes:[record.scope.answers.service],projectScope:clamp(record.customer.summary,1990),
    estimateSummary:clamp(JSON.stringify(record.internal),19_900),
    estimateLow:range?.low,estimateHigh:range?.high,estimateRange:range?clamp(`$${range.low} to $${range.high}`,95):undefined};
  let estimate:any={brand:brand.name,estimator:"p5-policy",id:record.draftId,revision:record.revision,scope:record.scope,internal:record.internal,customer:record.customer};
  let payload:any={...base,estimate};
  if(Buffer.byteLength(JSON.stringify(payload))>CRM_BODY_LIMIT){
    estimate={brand:brand.name,estimator:"p5-policy",id:record.draftId,revision:record.revision,
      scope:{text:clamp(record.scope.text,12_000),answers:record.scope.answers,reviewedAt:record.scope.reviewedAt},
      customer:record.customer};
    payload={...base,estimate};
  }
  if(Buffer.byteLength(JSON.stringify(payload))>CRM_BODY_LIMIT){
    estimate={brand:brand.name,estimator:"p5-policy",id:record.draftId,revision:record.revision,
      scope:{service:clamp(record.scope.answers?.service,100),reviewedAt:clamp(record.scope.reviewedAt,100)},
      customer:{status:clamp(record.customer.status,100),range:record.customer.range,summary:clamp(record.customer.summary,4000),disclaimer:clamp(record.customer.disclaimer,2000)}};
    payload={...base,estimate};
  }
  if(Buffer.byteLength(JSON.stringify(payload))>CRM_BODY_LIMIT)throw new Error("CRM estimate payload exceeds the verified request-body budget");
  return payload;
}
export async function adminRecipients(){return [...new Set(await getAdminRecipientEmails(brand.email))];}
export const EMAIL_SUPPORTS_IDEMPOTENCY=true;
export async function sendEmail(input:{to:string;subject:string;text:string;html?:string;attachments:{filename:string;content:Buffer}[];key:string}){
  const {client,fromEmail}=await getUncachableEmailClient();
  const sender=client.emails as unknown as {send:(body:unknown,options:unknown)=>Promise<any>};
  const result=await sender.send({from:formatFromAddress(fromEmail),to:input.to,replyTo:brand.email,subject:input.subject,text:input.text,html:input.html,attachments:input.attachments},{idempotencyKey:input.key});
  if(result?.error)throw new Error("Email provider rejected delivery");
  const id=result?.data?.id||result?.id;
  if(!id||id==="noop"||result?.skipped)throw new Error("Email delivery is not configured");
  return String(id);
}
export async function syncCrm(record:any,key:string){
  const token=process.env.LEAD_DASHBOARD_KEY;if(!token)throw new Error("CRM synchronization is not configured");
  const response=await fetch(process.env.LEAD_DASHBOARD_API_URL||brand.crmUrl,{
    method:"POST",signal:AbortSignal.timeout(20000),headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`,"Idempotency-Key":key},
    body:JSON.stringify(buildCrmPayload(record,key)),
  });
  const body=await response.json().catch(()=>({}));
  if(response.status===409&&body.error==="Duplicate submission"&&body.leadId)return String(body.leadId);
  if(!response.ok)throw new Error(`CRM returned HTTP ${response.status}`);
  if(body.success===false||body.accepted===false&&!body.duplicate)throw new Error("CRM did not accept the estimate");
  const id=body.leadId||body.id||body.lead?.id||body.dealId;
  if(!id)throw new Error("CRM acknowledged without a record identifier; verify before retrying");
  return String(id);
}
