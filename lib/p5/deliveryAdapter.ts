import {safeEmailReplyTo} from './emailReplyTo.ts';
import { getUncachableEmailClient } from "../../server/services/emailTransport";
import { getAdminRecipientEmails,formatFromAddress,decoratePreliminaryEstimateEmail } from "../../server/services/emailLayout";
import { ESTIMATOR_BRAND as brand } from "./brand";
export async function adminRecipients(){return [...new Set(await getAdminRecipientEmails(brand.email))];}
export const EMAIL_SUPPORTS_IDEMPOTENCY=true;
export async function sendEmail(input:{to:string;replyTo?:string;subject:string;text:string;html?:string;attachments:{filename:string;content:Buffer;contentType?:string}[];key:string}){
  const {client,fromEmail}=await getUncachableEmailClient();
  const sender=client.emails as unknown as {send:(body:unknown,options:unknown)=>Promise<any>};
  // The customer's preliminary estimate gains the after-estimate wording here
  // (greeting, Schedule now, adjust note, P.S.). Every other subject is sent
  // unchanged. The shared transport test stubs emailLayout without a
  // decorator; those messages keep the bytes the renderer produced.
  const message=typeof decoratePreliminaryEstimateEmail==="function"?decoratePreliminaryEstimateEmail(input):input;
  const result=await sender.send({from:formatFromAddress(fromEmail),to:input.to,replyTo:safeEmailReplyTo(input.replyTo,brand.email),subject:message.subject,text:message.text,html:message.html,attachments:input.attachments},{idempotencyKey:input.key});
  if(result?.error)throw new Error("Email provider rejected delivery");
  const id=result?.data?.id||result?.id;
  if(!id||id==="noop"||result?.skipped)throw new Error("Email delivery is not configured");
  return String(id);
}
/**
 * The CRM delivery of a published estimate (the outbox's `crm` job, queued while `P5_CRM_DELIVERY`
 * is `on`): it goes to P5 Home Co's lead system (owner decisions, 13, 17 and 18 November 2026).
 *
 * `forwardEstimateToP5()` (p5LeadIntake.ts, shared) posts it to P5's public lead intake as
 * `form: "p5-estimator"` under this brand, with `team_alert: "site"` (this site has already emailed
 * the team its internal estimate record, so P5 sends no second email), the key of the project request
 * it answers (`request_external_id`, so the request and its estimate are one lead) and an `estimate`
 * of kind `document`: the range the customer was shown, the contract price and each line's CUSTOMER
 * amount. No cost, margin, markup, profit, contingency or overhead figure is read or sent. P5 creates
 * the QuickBooks customer and an UNSENT estimate from those figures.
 *
 * It throws a short error, with no response body in it, when P5 does not accept the post, so the
 * outbox marks the job for review as it does for any CRM failure. A synthetic QA record is never
 * posted. No credential is read or sent. The old lead dashboard (`LEAD_DASHBOARD_API_URL`) is no
 * longer called from here.
 *
 * The forwarder is loaded when it is called, never as a static import: the shared
 * tests/p5-intake-reply-to.test.ts runs this file in a VM with a fixed list of dependencies.
 * `options` is a test seam (a fake fetch, another address); the outbox passes none.
 */
export async function syncCrm(record:any,key:string,options?:{fetch?:typeof fetch;url?:string}){
 const {forwardEstimateToP5}=await import('./p5LeadIntake.ts');
 return forwardEstimateToP5(record,key,{fetch:options?.fetch,url:options?.url,brand:brand.name});
}
/** Synchronous readiness only: the Resend key or the Replit connector identity must be present before an intake notification is attempted. */
export function emailTransportReady(){return Boolean(process.env.RESEND_API_KEY||(process.env.REPLIT_CONNECTORS_HOSTNAME&&(process.env.REPL_IDENTITY||process.env.WEB_REPL_RENEWAL)));}
