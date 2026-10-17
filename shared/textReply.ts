import { SITE_CONFIG } from "./siteConfig";

/**
 * Hours for the "Prefer to text?" line only. Office hours published elsewhere
 * stay on their own copy. One constant so this sentence cannot drift.
 */
export const TEXT_REPLY_HOURS = "Mon–Fri 9–6, Sat 9–4 MT";

export const TEXT_SMS_HREF = "sms:+12084771169";

export const TEXT_REPLY_LINE =
  `Prefer to text? Text ${SITE_CONFIG.phone}. We reply in minutes during business hours (${TEXT_REPLY_HOURS}).`;
