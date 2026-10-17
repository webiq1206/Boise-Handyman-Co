/**
 * City-only FAQs and the local section for /areas/{city} and
 * /services/{service}/{city}.
 *
 * Every sentence is already published: county membership, the Ada and Canyon
 * permit flow, city and neighborhood guides, and CITY_SEO_DATA neighborhoods.
 * Pages append these two questions after the published FAQs and mark up that
 * full visible list. The shared area questions stay on /areas.
 */
import type { CityData } from './contentData';
import { CITIES, getCountyLabel } from './contentData';
import { publishedPlaceFacts, type PublishedPlaceFacts } from './content/locationGuides';
import { CITY_SEO_DATA } from '@/lib/seo';

export interface CityFaq {
  question: string;
  answer: string;
}

export interface CityLocalSection {
  heading: string;
  paragraphs: string[];
  links: { label: string; href: string }[];
}

/** Cities the permit guide names as city-limits jurisdictions. Garden City is not on that list. */
const NAMED_ON_PERMIT_GUIDE = new Set([
  'boise',
  'meridian',
  'eagle',
  'kuna',
  'star',
  'nampa',
  'caldwell',
  'middleton',
]);

function plainParagraphs(html: string): string[] {
  return html
    .split(/<\/p>/i)
    .map((part) =>
      part
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter((part) => part.length > 0);
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

function neighborsInCounty(city: CityData): CityData[] {
  return CITIES.filter((other) => other.county === city.county && other.slug !== city.slug);
}

function permitAnswer(city: CityData, work: string): string {
  const county = getCountyLabel(city.county);
  if (NAMED_ON_PERMIT_GUIDE.has(city.slug)) {
    return `${city.name} is in ${county}. Inside ${city.name} city limits, the city building department reviews permitted ${work}. Outside those limits, ${county} does. Most handyman repairs stay on the usually-exempt side of the Ada and Canyon County permit flow: painting, drywall patching, caulking, and like-for-like fixture swaps. Moved wiring, moved plumbing, and structural changes usually need a permit and a licensed trade.`;
  }
  return `${city.name} is in ${county}. The Ada and Canyon County permit flow names city limits for Boise, Meridian, Eagle, Kuna, and Star, and for Nampa, Caldwell, and Middleton. ${city.name} is not on that list. Confirm which office reviews permitted ${work} before any job that moves wiring, plumbing, or structure. Painting, drywall patching, caulking, and like-for-like fixture swaps are the repairs that page lists as usually needing no permit.`;
}

function neighborhoodFaq(city: CityData, serviceName?: string): CityFaq {
  const places = publishedPlaceFacts(city.slug);
  const neighborhoods = places.filter((place) => place.guideType === 'neighborhood');
  const location = places.find((place) => place.guideType === 'location');
  const seo = CITY_SEO_DATA[city.name];
  const serviceBit = serviceName ? ` ${serviceName} in ${city.name} follows that same coverage.` : '';

  if (neighborhoods.length > 0) {
    const names = neighborhoods.map((place) => place.name);
    const detail = neighborhoods.map((place) => `${place.name} is covered. ${place.excerpt}`).join(' ');
    const listed = seo?.neighborhoods?.length
      ? ` Other areas on our ${city.name} service list include ${seo.neighborhoods.join(', ')}.`
      : '';
    return {
      question: `Does Boise Handyman Co serve ${joinNames(names)}?`,
      answer: `Yes.${serviceBit} ${detail}${listed}`,
    };
  }

  if (seo?.neighborhoods?.length) {
    const excerpt = location ? ` ${location.excerpt}` : '';
    return {
      question: serviceName
        ? `Which parts of ${city.name} are covered for ${serviceName.toLowerCase()}?`
        : `Which parts of ${city.name} do you serve?`,
      answer: `We serve homes throughout ${city.name}, including ${seo.neighborhoods.join(', ')}.${excerpt}${serviceBit}`,
    };
  }

  const county = getCountyLabel(city.county);
  const nearby = neighborsInCounty(city).map((other) => other.name).join(', ');
  return {
    question: `Which nearby cities do you serve with ${city.name}?`,
    answer: `${city.name} is in ${county}, and the same handyman visits cover ${nearby}.${serviceBit} Where you live in the service area never inflates the quote.`,
  };
}

/** Two city-only questions, appended after the published FAQs on the same page. */
export function getCityOnlyFaqs(city: CityData, serviceName?: string): CityFaq[] {
  const work = serviceName ? serviceName.toLowerCase() : 'a handyman repair';
  return [
    {
      question: `Which permit office handles ${work} in ${city.name}?`,
      answer: permitAnswer(city, work),
    },
    neighborhoodFaq(city, serviceName),
  ];
}

function locationProse(place: PublishedPlaceFacts): string[] {
  return [
    place.excerpt,
    ...plainParagraphs(place.housingStock),
    ...plainParagraphs(place.commonRepairs),
    ...plainParagraphs(place.watchOut),
    ...plainParagraphs(place.seasonal),
    ...(place.takeaways.length ? [place.takeaways.join(' ')] : []),
  ];
}

/**
 * One additive city section: published guide prose, county, permit guide, and
 * nearby service areas. Meridian, Nampa, and Caldwell use the same helper;
 * their guides are the ones also linked from the guide body.
 */
export function getCityLocalSection(city: CityData, serviceName?: string): CityLocalSection {
  const places = publishedPlaceFacts(city.slug);
  const location = places.find((place) => place.guideType === 'location');
  const neighborhoods = places.filter((place) => place.guideType === 'neighborhood');
  const county = getCountyLabel(city.county);
  const neighbors = neighborsInCounty(city);
  const paragraphs: string[] = [];

  if (location) paragraphs.push(...locationProse(location));

  for (const place of neighborhoods) {
    const housing = plainParagraphs(place.housingStock)[0];
    paragraphs.push(housing ? `${place.excerpt} ${housing}` : place.excerpt);
  }

  if (!location && neighborhoods.length === 0) {
    paragraphs.push(
      `${city.name} is in ${county}. Boise Handyman Co serves ${city.name} for small repairs, installs, and maintenance, with the same upfront written quote used across the Treasure Valley.`,
      `The Ada and Canyon County permit flow names city limits for Boise, Meridian, Eagle, Kuna, and Star, and for Nampa, Caldwell, and Middleton. ${city.name} is not on that list. Confirm which office reviews a permitted job in ${city.name} before work that moves wiring, plumbing, or structure.`,
    );
  }

  const work = serviceName ? serviceName.toLowerCase() : 'handyman repairs';
  paragraphs.push(
    `${city.name} permit checks start with ${county}. Inside a named city's limits, that city's building department reviews permitted ${work}. Outside those limits, ${county} does. The Ada and Canyon County permit flow is the reference already published for that line.`,
    `Nearby ${county} service areas served with ${city.name} are ${neighbors.map((other) => other.name).join(', ')}.`,
  );

  const links: CityLocalSection['links'] = [];
  if (serviceName) {
    links.push({ label: `Handyman services in ${city.name}`, href: `/areas/${city.slug}` });
  }
  if (location) links.push({ label: location.title, href: `/guides/${location.slug}` });
  for (const place of neighborhoods) {
    links.push({ label: place.title, href: `/guides/${place.slug}` });
  }
  links.push({
    label: 'When a home repair needs a permit',
    href: '/resources/ada-canyon-permit-flow',
  });
  for (const other of neighbors) {
    links.push({ label: `Handyman in ${other.name}`, href: `/areas/${other.slug}` });
  }

  return {
    heading: serviceName
      ? `${serviceName} in ${city.name}: homes, permits, and nearby areas`
      : `${city.name} homes, permits, and nearby areas`,
    paragraphs,
    links,
  };
}
