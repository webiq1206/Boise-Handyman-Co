/**
 * Central site configuration - NAP, URLs, and contact strings.
 * Override via env for staging; replace placeholder values before launch.
 */

const DEFAULT_PHONE = "(208) 477-1169";
const DEFAULT_PHONE_TEL = "2084771169";
const DEFAULT_EMAIL = "hello@boisehandyman.co";
// This site now lives on its own domain. The old general-contractor site was
// duplicated and rebuilt as Boise Handyman Co, which runs at boisehandyman.co;
// the general-contracting business remains on its original domain. Every
// canonical, sitemap entry, OG URL, schema @id, and absolute link is built from
// this value.
const DEFAULT_SITE_URL = "https://boisehandyman.co";

export const SITE_CONFIG = {
  name: "Boise Handyman Co",
  // NEEDS: confirm the registered legal entity name for Boise Handyman before
  // launch. Set to the brand name (no invented "LLC" suffix) until confirmed.
  /**
   * The registered legal entity. This brand is an Idaho assumed business name
   * (DBA) of P5 Home Co LLC - there is no separate "Boise Handyman Co" company.
   * `name` above stays the DBA, which is what customers know and what belongs
   * in a GBP business-name field; `legalName` is the entity that actually
   * signs contracts, holds the registration and gets verified against state
   * records, so the two are deliberately different values.
   */
  legalName: "P5 Home Co LLC",
  phone: process.env.NEXT_PUBLIC_PHONE ?? DEFAULT_PHONE,
  phoneTel: process.env.NEXT_PUBLIC_PHONE_TEL ?? DEFAULT_PHONE_TEL,
  phoneHref: `tel:${process.env.NEXT_PUBLIC_PHONE_TEL ?? DEFAULT_PHONE_TEL}`,
  phoneSmsHref: `sms:${process.env.NEXT_PUBLIC_PHONE_TEL ?? DEFAULT_PHONE_TEL}`,
  email: process.env.NEXT_PUBLIC_EMAIL ?? DEFAULT_EMAIL,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL,
  // Public representative named in the P5 contact records. Published as the
  // contact, not as an owner and not as storefront staff.
  publicRepresentative: "Nick Perkins",
  // Authorized public address. The business stays a service-area operation:
  // publish the street where an address is required, and do not describe it
  // as a staffed storefront.
  address: {
    street: "4031 W Wapoot St",
    city: "Meridian",
    state: "ID",
    postalCode: "83646",
    cityState: "Meridian, ID",
    serviceArea: "Treasure Valley · Ada and Canyon County",
  },
} as const;

/**
 * One visible NAP line for footers and contact surfaces.
 * Wording matches the family string: public representative, street address,
 * then the service-area disclaimer. No extra facts.
 */
export const PUBLIC_NAP_LINE =
  `Public representative: ${SITE_CONFIG.publicRepresentative} · ${SITE_CONFIG.address.street}, ${SITE_CONFIG.address.city}, ${SITE_CONFIG.address.state} ${SITE_CONFIG.address.postalCode} · Service-area business, not a staffed storefront.`;

/** Storefront disclaimer used wherever the shorter NAP phrase is published. */
export const SERVICE_AREA_DISCLAIMER = "Service-area business, not a staffed storefront.";

/**
 * Answer-first entity sentence already published in LocalBusiness schema.
 * City pages may name another city; the homepage uses Boise.
 */
export function handymanServiceSentence(city = "Boise"): string {
  return `Handyman service for ${city} and the Treasure Valley, Idaho. Small repairs, installs, and home maintenance: drywall, painting, minor plumbing and electrical, carpentry, and mounting.`;
}

export function formatPhoneDisplay(tel: string = SITE_CONFIG.phoneTel): string {
  const digits = tel.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return SITE_CONFIG.phone;
}
