/**
 * Lead confirmation copy and the Schedule now button.
 *
 * One booking page serves every brand. The URL cannot preselect a length, so
 * the sentence above the button tells the lead which option to choose:
 * 1 hour for a home walkthrough, 15 minutes for a phone consult.
 *
 * The button is a table, with Outlook VML beside it, so Gmail, Outlook and
 * iOS Mail all show a real button without depending on a stylesheet.
 *
 * Matches the parent confirmation in p5-home-co (scheduleEmail.ts).
 */

import { EMAIL_BRAND, htmlToPlainText } from "@/server/services/emailLayout";
import { SITE_CONFIG } from "@/shared/siteConfig";

/** HubSpot meetings page. Durations on the page are 15, 30, 60 and 120 minutes. */
export const SCHEDULE_URL = "https://meetings-na2.hubspot.com/client3";

export const BUTTON_CHARCOAL = "#383837";
export const BUTTON_WHITE = "#ffffff";
export const BUTTON_PAPER = "#fbfaf6";

/** Handyman brand accent, the bar under the charcoal button. */
export const HANDYMAN_ACCENT = "#C56B4A";

export type ScheduleIntent = "walkthrough" | "consult";

export const ESTIMATE_DISCLAIMER =
  "We work hard to make that estimate as realistic as we can, but we can't give you a true bid until we walk the property. Depending on the scope and what we find, the bid may come in higher or lower than this first estimate. Either way, we'll work with you to get you what you want, within your budget.";

export const SHARED_DISCLAIMER =
  "We work hard to make any estimate we share as realistic as we can, but we can't give you a true bid until we walk the property. Depending on the scope and what we find, the bid may come in higher or lower than that first estimate. Either way, we'll work with you to get you what you want, within your budget.";

/**
 * Estimate emails only (owner wording, 16 November 2026). The same words the
 * family's central estimator uses after an estimate (p5-home-co,
 * app/lib/estimator/family.ts). They live here once: the letter below and the
 * email builders that embed it import them. Request confirmations
 * (requestLetter) and every team email stay without them.
 */
export const ESTIMATE_ADJUST_NOTE =
  "If something is missing, or you'd like to change the scope, the finishes or the timing, tell us. It's easy to adjust, and we'd rather get it right than have you guessing.";

/** Always a question, never a pitch, and always the last paragraph of the email. */
export const ESTIMATE_FAMILY_PS =
  "P.S. Anything else on your list? Boise Handyman Co is part of P5 Home Co, the company behind Boise Construction Co, Boise Remodeling Co and Boise Cabinet Co. So whether it's a few repairs, new cabinets, a full kitchen or bath remodel, an addition or a new home, tell us and we'll plan it alongside this project.";

export function scheduleIntentFor(input: { requestKind?: string | null; form?: string | null }): ScheduleIntent {
  const kind = (input.requestKind ?? "").trim().toLowerCase();
  const form = (input.form ?? "").trim().toLowerCase();
  if (kind === "callback" || form === "site chat" || form.includes("call you")) return "consult";
  return "walkthrough";
}

/** The words that tell the lead which length to pick on the shared booking page. */
export function durationChoice(intent: ScheduleIntent): string {
  return intent === "consult" ? "the 15 minute option for a phone consult" : "the 1 hour option for a home walkthrough";
}

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeHref(value: string): string {
  const trimmed = value.trim();
  if (!/^https:\/\/[^\s"'<>]+$/.test(trimmed)) return SCHEDULE_URL;
  return trimmed;
}

function safeAccent(value: string | undefined): string {
  return /^#[0-9a-fA-F]{6}$/.test(value ?? "") ? (value as string) : HANDYMAN_ACCENT;
}

export function greetingName(firstName: string | null | undefined): string {
  const name = (firstName ?? "").trim();
  return name || "there";
}

/** Estimate emails greet with "Hey". Request confirmations keep "Hi". */
export function estimateGreeting(firstName: string | null | undefined): string {
  return `Hey ${greetingName(firstName)},`;
}

export function contactLine(phone: string | undefined): string {
  const shown = (phone ?? "").trim() || SITE_CONFIG.phone;
  return `If you have questions, just reply to this email or call ${shown}.`;
}

/**
 * A full-width button. Primary is charcoal with white text and a brand
 * accent bar. Secondary is an outline on paper, shorter, so it reads as
 * the quieter action.
 */
export function bulletproofButton(options: {
  href: string;
  label: string;
  variant: "primary" | "secondary";
  accent?: string;
}): string {
  const href = esc(safeHref(options.href));
  const label = esc(options.label);
  const accent = safeAccent(options.accent);
  if (options.variant === "secondary") {
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:0 0 18px;">
<tr>
<td align="center" bgcolor="${BUTTON_PAPER}" style="background-color:${BUTTON_PAPER};border:2px solid ${BUTTON_CHARCOAL};">
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:44px;v-text-anchor:middle;width:520px;" arcsize="4%" strokecolor="${BUTTON_CHARCOAL}" fillcolor="${BUTTON_PAPER}">
<w:anchorlock/>
<center style="color:${BUTTON_CHARCOAL};font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;">${label}</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<a href="${href}" target="_blank" style="display:block;padding:12px 20px;background-color:${BUTTON_PAPER};color:${BUTTON_CHARCOAL};font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;line-height:20px;text-align:center;text-decoration:none;border:0;mso-hide:all;">${label}</a>
<!--<![endif]-->
</td>
</tr>
</table>`;
  }
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:8px 0 0;">
<tr>
<td align="center" bgcolor="${BUTTON_CHARCOAL}" style="background-color:${BUTTON_CHARCOAL};">
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:56px;v-text-anchor:middle;width:520px;" arcsize="4%" strokecolor="${BUTTON_CHARCOAL}" fillcolor="${BUTTON_CHARCOAL}">
<w:anchorlock/>
<center style="color:${BUTTON_WHITE};font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:bold;">${label}</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<a href="${href}" target="_blank" style="display:block;padding:16px 24px;background-color:${BUTTON_CHARCOAL};color:${BUTTON_WHITE};font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;line-height:24px;text-align:center;text-decoration:none;border:0;mso-hide:all;">${label}</a>
<!--<![endif]-->
</td>
</tr>
<tr>
<td bgcolor="${accent}" style="background-color:${accent};height:4px;font-size:0;line-height:0;">&nbsp;</td>
</tr>
</table>`;
}

/** Paper card so the charcoal button stays visible inside the dark email shell. */
export function paperPanel(inner: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:0 0 8px;">
<tr>
<td bgcolor="${BUTTON_PAPER}" style="background-color:${BUTTON_PAPER};padding:22px 18px 8px;color:${BUTTON_CHARCOAL};font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;">
${inner}
</td>
</tr>
</table>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;color:${BUTTON_CHARCOAL};font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;">${esc(text)}</p>`;
}

export type RequestLetter = {
  html: string;
  text: string;
};

/**
 * Short request and callback confirmation. The shell around this letter
 * (logo, subject) stays with the caller. Subject lines are unchanged.
 */
export function requestLetter(input: {
  firstName: string | null;
  brandName?: string;
  intent: ScheduleIntent;
  phone?: string;
  accent?: string;
}): RequestLetter {
  const first = greetingName(input.firstName);
  const brandName = (input.brandName ?? SITE_CONFIG.name).trim() || SITE_CONFIG.name;
  const phone = contactLine(input.phone);
  const thanks = `Thanks for reaching out to ${brandName}. We have your request, and someone from the team will follow up shortly.`;
  const next = `If you would like to get on the calendar now, use the button below and choose ${durationChoice(input.intent)}.`;
  const signoff = `The ${brandName} team`;
  const text = [
    `Hi ${first},`,
    "",
    thanks,
    "",
    next,
    "",
    `Schedule now: ${SCHEDULE_URL}`,
    "",
    SHARED_DISCLAIMER,
    "",
    phone,
    "",
    signoff,
  ].join("\n");
  const html = [
    paragraph(`Hi ${first},`),
    paragraph(thanks),
    paragraph(next),
    bulletproofButton({ href: SCHEDULE_URL, label: "Schedule now", variant: "primary", accent: input.accent ?? HANDYMAN_ACCENT }),
    `<div style="height:16px;line-height:16px;font-size:0;">&nbsp;</div>`,
    paragraph(SHARED_DISCLAIMER),
    paragraph(phone),
    paragraph(signoff),
  ].join("");
  return { html, text };
}

/** Walkthrough sentence used when the lead already has an estimate in the message. */
export function estimateNextStep(intent: ScheduleIntent): string {
  if (intent === "consult") {
    return `If you would like to get on the calendar now, use the button below and choose ${durationChoice("consult")}.`;
  }
  return "The next step is a home walkthrough, so we can see the property and turn this estimate into a true bid. On the scheduling page, choose the 1 hour option.";
}

/**
 * Greeting, button, the invitation to adjust, the disclaimer and the sentence
 * that names the meeting length. The letter sits at the top of a longer email,
 * so the P.S. is not in it: the email builder ends with estimatePostscript().
 */
export function estimateScheduleLetter(input: {
  firstName: string | null;
  intro: string;
  intent: ScheduleIntent;
  phone?: string;
  accent?: string;
  signoff?: string;
}): RequestLetter {
  const greeting = estimateGreeting(input.firstName);
  const phone = contactLine(input.phone);
  const next = estimateNextStep(input.intent);
  const signoff = input.signoff ?? `The ${SITE_CONFIG.name} team`;
  const text = [
    greeting,
    "",
    input.intro,
    "",
    next,
    "",
    `Schedule now: ${SCHEDULE_URL}`,
    "",
    ESTIMATE_ADJUST_NOTE,
    "",
    ESTIMATE_DISCLAIMER,
    "",
    phone,
    "",
    signoff,
  ].join("\n");
  const html = [
    paragraph(greeting),
    paragraph(input.intro),
    paragraph(next),
    bulletproofButton({ href: SCHEDULE_URL, label: "Schedule now", variant: "primary", accent: input.accent ?? HANDYMAN_ACCENT }),
    `<div style="height:16px;line-height:16px;font-size:0;">&nbsp;</div>`,
    paragraph(ESTIMATE_ADJUST_NOTE),
    paragraph(ESTIMATE_DISCLAIMER),
    paragraph(phone),
    paragraph(signoff),
  ].join("");
  return { html, text };
}

/**
 * The P.S. that closes every estimate email, after the sign-off. It goes at
 * the end of the email body, outside the paper panel, so it is set in the
 * shell's own text color.
 */
export function estimatePostscript(): RequestLetter {
  return {
    text: ESTIMATE_FAMILY_PS,
    html: `<p style="margin:24px 0 0;color:${EMAIL_BRAND.text};font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;">${esc(ESTIMATE_FAMILY_PS)}</p>`,
  };
}

/**
 * The document estimator (lib/p5, /estimate/scope) builds its customer email
 * in the shared engine, a file this repository must not change. These are the
 * places in that template where the after-estimate wording goes.
 */
const ESTIMATE_THANKS_MARKER = "Your preliminary estimate is below, and the complete estimate is attached as a PDF.</p>";
const ESTIMATE_VIEW_ANCHOR = ">View or update your estimate online</a>";
/** The shared template opens "Hi <first>," directly above its thank-you line. "Hello," (no name) is left alone. */
const ESTIMATE_GREETING = />Hi ([^<>]+,)<\/p>(?=<p [^>]*>Thank you for using the )/;
/** Where the shared customer layout ends its letter and starts its footer. */
const ESTIMATE_FOOTER_START = '</td></tr>\n <tr><td class="pad" style="padding:18px 28px 22px;border-top:';

/** The P.S. closes the letter: the last paragraph of the body, directly above the brand footer. */
function appendFamilyPs(html: string): string {
  const footer = html.lastIndexOf(ESTIMATE_FOOTER_START);
  if (footer >= 0) {
    const ps = `<p style="margin:20px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${BUTTON_CHARCOAL};">${esc(ESTIMATE_FAMILY_PS)}</p>`;
    return html.slice(0, footer) + ps + html.slice(footer);
  }
  const body = html.lastIndexOf("</body>");
  const ps = paragraph(ESTIMATE_FAMILY_PS);
  return body >= 0 ? html.slice(0, body) + ps + html.slice(body) : html + ps;
}

/**
 * Adds the after-estimate wording to the document estimator's customer email,
 * at send time (lib/p5/deliveryAdapter.ts): the "Hey" greeting, the Schedule
 * now button, the adjust note above the estimate disclaimer, and the family
 * P.S. as the last paragraph. Only the customer's preliminary estimate is
 * touched. Team, alert and project-request messages pass through unchanged,
 * and no price, scope line or link in the estimate moves.
 */
export function decoratePreliminaryEstimateEmail<T extends { subject: string; text: string; html?: string }>(input: T): T {
  const prefix = `Your ${SITE_CONFIG.name} preliminary estimate`;
  if (!input.subject.startsWith(prefix)) return input;
  if (input.text.includes(SCHEDULE_URL) || (input.html ?? "").includes(SCHEDULE_URL)) return input;

  const next = estimateNextStep("walkthrough");
  const schedule =
    paragraph(next) +
    bulletproofButton({ href: SCHEDULE_URL, label: "Schedule now", variant: "primary", accent: HANDYMAN_ACCENT }) +
    `<div style="height:12px;line-height:12px;font-size:0;">&nbsp;</div>`;
  const closing = paragraph(ESTIMATE_ADJUST_NOTE) + paragraph(ESTIMATE_DISCLAIMER);
  let html = input.html;
  if (html && html.includes(ESTIMATE_THANKS_MARKER)) {
    html = html.replace(ESTIMATE_GREETING, (_match, name: string) => `>Hey ${name}</p>`);
    html = html.replace(ESTIMATE_THANKS_MARKER, ESTIMATE_THANKS_MARKER + schedule);
    const anchorAt = html.indexOf(ESTIMATE_VIEW_ANCHOR);
    const tableEnd = anchorAt >= 0 ? html.indexOf("</table>", anchorAt) : -1;
    if (tableEnd >= 0) {
      const cut = tableEnd + "</table>".length;
      html = html.slice(0, cut) + closing + html.slice(cut);
    } else {
      html = html.replace(ESTIMATE_THANKS_MARKER + schedule, ESTIMATE_THANKS_MARKER + schedule + closing);
    }
  } else if (html) {
    const block = schedule + closing;
    html = html.includes("</body>") ? html.replace("</body>", block + "</body>") : html + block;
  }
  if (html) html = appendFamilyPs(html);

  const lead = `${next}\n\nSchedule now: ${SCHEDULE_URL}\n\n`;
  const after = `${ESTIMATE_ADJUST_NOTE}\n\n${ESTIMATE_DISCLAIMER}`;
  const viewRe = /View or update your estimate online:[^\n]*\n/;
  const body = viewRe.test(input.text)
    ? input.text.replace(viewRe, (line) => `${lead}${line}\n${after}\n\n`)
    : `${input.text}\n\n${lead}${after}\n`;
  const text = `${body.replace(/\s+$/, "")}\n\n${ESTIMATE_FAMILY_PS}`;

  return { ...input, text, html };
}

/** Plain text for a rendered confirmation. Drops Outlook VML and keeps the booking URL. */
export function leadConfirmationPlainText(html: string): string {
  const text = htmlToPlainText(html.replace(/<!--[\s\S]*?-->/g, ""));
  if (text.includes(SCHEDULE_URL)) return text;
  const labeled = `Schedule now: ${SCHEDULE_URL}`;
  if (text.includes("Schedule now")) return text.replace("Schedule now", labeled);
  return `${text}\n\n${labeled}`;
}
