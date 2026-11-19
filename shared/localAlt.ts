/**
 * Local search wording for image descriptions (owner, 19 November 2026: every
 * image on every page carries an alt that names the work and the place).
 *
 * The form is "<work> in <city>, Idaho: <what the picture shows>". The part
 * after the colon stays a plain account of what is in the frame, for screen
 * readers. Owner direction, same day: no qualifier such as "idea", "concept"
 * or "representative" in or beside an image description.
 */

export interface LocalAltContext {
  /** The work the page is about: "drywall repair", "home maintenance". Defaults to "handyman services". */
  subject?: string;
  /** City name without the state. Defaults to Boise, the primary city. */
  city?: string;
}

const CITY_NAMES = ['Boise', 'Meridian', 'Eagle', 'Nampa', 'Kuna', 'Star', 'Middleton', 'Caldwell', 'Garden City'];

const SUBJECT_BY_SLUG: Record<string, string> = {
  'drywall-repair': 'drywall repair',
  'painting-touch-ups': 'painting and touch-ups',
  'plumbing-repairs': 'plumbing repair',
  'electrical-repairs': 'electrical repair',
  'carpentry-trim-repair': 'carpentry and trim repair',
  'mounting-assembly': 'mounting and assembly',
  'fence-deck-gutter-repair': 'fence, deck and gutter repair',
  'home-maintenance': 'home maintenance',
};

const CITY_BY_SLUG: Record<string, string> = {
  boise: 'Boise', meridian: 'Meridian', eagle: 'Eagle', nampa: 'Nampa', kuna: 'Kuna', star: 'Star',
  middleton: 'Middleton', caldwell: 'Caldwell', 'garden-city': 'Garden City',
};

/** "drywall-repair" to "drywall repair"; anything else is returned as given. */
export function subjectForService(slugOrNoun: string | undefined): string | undefined {
  if (!slugOrNoun) return undefined;
  return SUBJECT_BY_SLUG[slugOrNoun] ?? slugOrNoun;
}

export function cityForSlug(slug: string | undefined): string | undefined {
  return slug ? CITY_BY_SLUG[slug] : undefined;
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Lower the first letter unless the description opens with a name or an acronym. */
function lowerFirst(text: string): string {
  const first = (text.split(/\s+/)[0] ?? '').replace(/[^A-Za-z]/g, '');
  if (/^[A-Z]{2,}/.test(first) || CITY_NAMES.some((name) => name.split(' ')[0] === first) || /^(P5|Idaho|Treasure|Ada|Canyon|Nick|Perkins)\b/.test(text)) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}

export function localAlt(description: string, context: LocalAltContext = {}): string {
  const text = description.trim().replace(/\.$/, '');
  if (!text) return '';
  if (/\bIdaho\b/.test(text)) return text;
  const subject = capitalise((context.subject ?? 'handyman services').trim());
  const city = (context.city ?? 'Boise').replace(/,\s*(Idaho|ID)$/i, '').trim();
  return `${subject} in ${city}, Idaho: ${lowerFirst(text)}`;
}

/** The city a tag list names, if any ("eagle" to "Eagle"). */
export function cityFromTags(tags: readonly string[] | undefined): string | undefined {
  if (!tags) return undefined;
  for (const tag of tags) {
    const match = CITY_NAMES.find((name) => name.toLowerCase() === tag.toLowerCase());
    if (match) return match;
  }
  return undefined;
}

const SUBJECT_BY_TAG: Record<string, string> = {
  'drywall repair': 'drywall repair',
  drywall: 'drywall repair',
  painting: 'painting and touch-ups',
  plumbing: 'plumbing repair',
  'toilet repair': 'plumbing repair',
  lighting: 'electrical repair',
  electrical: 'electrical repair',
  'tv mounting': 'mounting and assembly',
  installs: 'mounting and assembly',
  gutters: 'fence, deck and gutter repair',
  deck: 'fence, deck and gutter repair',
  fence: 'fence, deck and gutter repair',
  caulking: 'home maintenance',
  weatherstripping: 'home maintenance',
  winterizing: 'home maintenance',
  seasonal: 'home maintenance',
  maintenance: 'home maintenance',
  'home maintenance': 'home maintenance',
  'home repair': 'home repair',
  'home repairs': 'home repair',
  repairs: 'home repair',
  'punch list': 'home repair',
};

export function subjectFromTags(tags: readonly string[] | undefined): string | undefined {
  if (!tags) return undefined;
  for (const tag of tags) {
    const subject = SUBJECT_BY_TAG[tag.toLowerCase()];
    if (subject) return subject;
  }
  return undefined;
}
