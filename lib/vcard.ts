import { BUSINESS_INFO } from "@/lib/seo";
import { SITE_CONFIG } from "@/shared/siteConfig";

/** Escape special characters per vCard 3.0 (RFC 2426). */
function escapeVCard(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function formatTelE164(tel: string): string {
  const digits = tel.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return tel;
}

const textEncoder = new TextEncoder();

function octetLength(value: string): number {
  return textEncoder.encode(value).length;
}

/**
 * Fold one logical line so every physical line is at most 75 octets.
 * A continuation begins with a single space, and a multibyte character stays
 * intact. CRLF separates the physical lines.
 */
function foldLine(line: string, max = 75): string {
  if (octetLength(line) <= max) return line;
  const parts: string[] = [];
  let remaining = line;
  let budget = max;
  while (octetLength(remaining) > budget) {
    let take = 0;
    let used = 0;
    for (const char of remaining) {
      const size = octetLength(char);
      if (used + size > budget) break;
      used += size;
      take += char.length;
    }
    if (take === 0) break;
    parts.push(remaining.slice(0, take));
    remaining = remaining.slice(take);
    budget = max - 1;
  }
  if (remaining) parts.push(remaining);
  return parts.map((part, index) => (index === 0 ? part : ` ${part}`)).join("\r\n");
}

/** Build a vCard 3.0 payload from canonical site config (single source of truth). */
export function buildBusinessVCard(): string {
  const tel = formatTelE164(SITE_CONFIG.phoneTel);
  const hoursSummary = Object.entries(BUSINESS_INFO.hours)
    .map(([day, hours]) => `${day[0].toUpperCase()}${day.slice(1)} ${hours}`)
    .join("; ");

  // Social profiles are intentionally left off the vCard for now: the Facebook
  // and Instagram handles still carry the old `boiseremodeling` slug, and until
  // it is confirmed whether the profiles were renamed, a saved contact should
  // not ship a link that may point at the wrong or a defunct account.
  const note = [
    "Repairs, installs and maintenance in Boise and the Treasure Valley.",
    "A P5 Home Co company (P5 Home Co LLC, Idaho Registered Contractor #8381215).",
    SITE_CONFIG.address.serviceArea,
    "Service-area business, not a staffed storefront.",
    `Hours: ${hoursSummary}`,
  ].join("\n");

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    foldLine(`N:Perkins;Nick;;;`),
    foldLine(`FN:${escapeVCard(SITE_CONFIG.publicRepresentative)}`),
    foldLine(`ORG:${escapeVCard(SITE_CONFIG.name)}`),
    foldLine(`TITLE:Founder`),
    foldLine(`TEL;TYPE=WORK,VOICE:${tel}`),
    foldLine(`EMAIL;TYPE=WORK:${escapeVCard(SITE_CONFIG.email)}`),
    foldLine(`URL:${escapeVCard(SITE_CONFIG.siteUrl)}`),
    foldLine(
      `ADR;TYPE=WORK:;;;${escapeVCard(SITE_CONFIG.address.city)};${escapeVCard(SITE_CONFIG.address.state)};${escapeVCard(SITE_CONFIG.address.postalCode)};USA`,
    ),
    foldLine(`NOTE:${escapeVCard(note)}`),
    "END:VCARD",
  ];

  return `${lines.join("\r\n")}\r\n`;
}

export const BUSINESS_VCARD_PATH = "/contact.vcf";
export const BUSINESS_VCARD_FILENAME = "Boise-Handyman-Co.vcf";
