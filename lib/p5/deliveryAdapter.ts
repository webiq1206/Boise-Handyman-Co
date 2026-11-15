import {safeEmailReplyTo} from './emailReplyTo.ts';
import { getUncachableEmailClient } from "../../server/services/emailTransport";
import { getAdminRecipientEmails } from "../../server/services/emailLayout";
import { ESTIMATOR_BRAND as brand } from "./brand";
import {buildCrmPayload as boundedPayload} from './boundedCrmPayload';
import {crmIdentity,deliverKeyedCrm} from './keyedCrm';
/** Jared ruling: the From name is P5 Home Co at the P5 sending address. The message body stays this brand. */
export const ESTIMATOR_FROM = "P5 Home Co <hello@p5homeco.com>";
const FAILURE_ALERT = "hello@p5homeco.com";
const alertedKeys = new Set<string>();
export function buildCrmPayload(record:any,key:string){return boundedPayload({...record,brand:record.brand||brand.name,estimator:record.estimator||"p5-policy"},key,brand.domain);}
export async function adminRecipients(){return [...new Set(await getAdminRecipientEmails(brand.email))];}
/** The outbox must not schedule another customer send. One retry happens inside this request. */
export const EMAIL_SUPPORTS_IDEMPOTENCY=false;
export function isTransientEmailError(error: unknown): boolean {
  const err = error as { code?: string; message?: string; statusCode?: number };
  const code = String(err?.code || "");
  const message = String(err?.message || "");
  if (err?.statusCode === 429 || (Number.isInteger(err?.statusCode) && Number(err.statusCode) >= 500 && Number(err.statusCode) <= 599)) return true;
  if (Number.isInteger(err?.statusCode) && Number(err.statusCode) >= 400) return false;
  if (/EAUTH|EENVELOPE|EMESSAGE/i.test(code)) return false;
  if (/\b(535|550|551|552|553|554)\b/.test(message)) return false;
  if (/\b(421|450|451|452)\b/.test(message)) return true;
  return /ETIMEDOUT|ECONNRESET|ECONNREFUSED|EAI_AGAIN|ESOCKET|EPIPE|timeout|socket hang up|try again/i.test(`${code} ${message}`);
}
function acceptedId(result: any): string {
  if (result?.error) throw Object.assign(new Error("Email provider rejected delivery"), {statusCode: result.error.statusCode});
  const id = result?.data?.id || result?.id;
  if (!id || id === "noop" || result?.skipped) throw new Error("Email delivery is not configured");
  return String(id);
}
export async function sendEmail(input:{to:string;replyTo?:string;subject:string;text:string;html?:string;attachments:{filename:string;content:Buffer;contentType?:string}[];key:string;suppressFailureAlert?:boolean}){
  const {client}=await getUncachableEmailClient("p5homeco.com");
  const sender=client.emails as unknown as {send:(body:unknown,options:unknown)=>Promise<any>};
  const body={from:ESTIMATOR_FROM,to:input.to,replyTo:safeEmailReplyTo(input.replyTo,brand.email),subject:input.subject,text:input.text,html:input.html,attachments:input.attachments};
  const once=()=>sender.send(body,{idempotencyKey:input.key});
  try {
    return acceptedId(await once());
  } catch (error) {
    if (!isTransientEmailError(error)) {
      if (!input.suppressFailureAlert) await alertFailedCustomer(input, error);
      throw error;
    }
    console.error(`[estimator-email] retrying once key=${input.key}`);
    try {
      return acceptedId(await once());
    } catch (again) {
      const message = again instanceof Error ? again.message : "Delivery failed";
      console.error(`[estimator-email] failed key=${input.key}: ${message.slice(0, 200)}`);
      if (!input.suppressFailureAlert) await alertFailedCustomer(input, again);
      throw again;
    }
  }
}
async function alertFailedCustomer(input:{to:string;key:string}, error: unknown){
  if (input.to === FAILURE_ALERT || input.to === brand.email) return;
  if (alertedKeys.has(input.key)) return;
  alertedKeys.add(input.key);
  const message = error instanceof Error ? error.message : "Delivery failed";
  try {
    const {client}=await getUncachableEmailClient("p5homeco.com");
    const sender=client.emails as unknown as {send:(body:unknown,options:unknown)=>Promise<any>};
    await sender.send({
      from: ESTIMATOR_FROM,
      to: FAILURE_ALERT,
      replyTo: brand.email,
      subject: `${brand.name}: customer estimate email was not delivered`,
      text: `The customer estimate email was not delivered. It was not sent again.\nBrand: ${brand.name}\nKey: ${input.key}\nReason: ${message.slice(0, 300)}\n`,
    }, {idempotencyKey: `alert-${input.key}`});
  } catch (alertError) {
    const detail = alertError instanceof Error ? alertError.message : "alert failed";
    console.error(`[estimator-email] failure alert was not delivered key=${input.key}: ${detail.slice(0, 200)}`);
  }
}
export async function syncCrm(record:any,key:string,options?:{token:string;url:string;fetch:typeof fetch}){
 const identity=crmIdentity(record,key,brand.domain);
 const built=buildCrmPayload(record,identity.externalLeadId);
 const payload={...built,...identity};
 return deliverKeyedCrm(payload,key,options?options.token:process.env.LEAD_DASHBOARD_KEY||'',options?options.url:process.env.LEAD_DASHBOARD_API_URL||brand.crmUrl,options?.fetch||fetch);
}
/** Synchronous readiness only: the Resend key or the Replit connector identity must be present before an intake notification is attempted. */
export function emailTransportReady(){return Boolean(process.env.RESEND_API_KEY||(process.env.REPLIT_CONNECTORS_HOSTNAME&&(process.env.REPL_IDENTITY||process.env.WEB_REPL_RENEWAL)));}
