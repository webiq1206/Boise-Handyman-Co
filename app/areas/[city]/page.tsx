import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import { LandingPageTemplate } from '@/components/seo/LandingPageTemplate';
import { buildPageMetadata } from '@/lib/page-metadata';
import {
  landingAreaBusinessSchema,
  landingBreadcrumbs,
  landingFAQSchema,
} from '@/lib/landing-schema';
import { CITY_SEO_DATA } from '@/lib/seo';
import { areaPath, CITY_SLUGS, getCityBySlug } from '@/lib/seo-routes';
import { getCountyLabel, SERVICES } from '@/shared/contentData';
import { AREA_PAGE_FAQS, getAreaIntro } from '@/shared/seoContent';
import { generateSpeakableSchema } from '@/lib/schema';
import { getAreaImageSet } from '@/shared/cityServiceImages';
import type { LandingSection, LandingProof } from '@/components/seo/LandingPageTemplate';
import { getGalleryProjectsForCity } from '@/shared/galleryData';
import { SITE_CONFIG } from '@/shared/siteConfig';

export function generateStaticParams() {
  return CITY_SLUGS.map((city) => ({ city }));
}

export async function generateMetadata({
  params,
}: {
  params: { city: string };
}) {
  const cityData = getCityBySlug(params.city);
  if (!cityData) return {};
  return buildPageMetadata({
    kind: 'area',
    cityName: cityData.name,
    citySlug: cityData.slug,
    path: areaPath(cityData.slug),
  });
}

export default function AreaPage({ params }: { params: { city: string } }) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const seo = CITY_SEO_DATA[city.name];
  const county = getCountyLabel(city.county);
  const path = areaPath(city.slug);
  const overview = getAreaIntro(city);
  const images = getAreaImageSet(city.slug);
  const localNote = seo
    ? `We serve ${city.name} homeowners across ${seo.neighborhoods.slice(0, 3).join(', ')}, and all of ${county}. Same-week scheduling is typical, and where you are in the service area never changes the price.`
    : `We serve ${city.name} and all of ${county} with handyman repairs, installs, and maintenance.`;

  const neighborhoods = seo?.neighborhoods ?? [];
  const landmarks = seo?.landmarks ?? [];

  const sections: LandingSection[] = [
    {
      heading: `Handyman services in ${city.name}`,
      paragraphs: [
        `${SITE_CONFIG.name} is a locally owned handyman service covering ${city.name} and the surrounding ${county} area. Whether it is a drywall patch, a dripping faucet, a sticking door, a TV that needs mounting, or a whole to-do list, every job runs the same way: an upfront quote from photos, an agreed arrival time, and a one-trip fix whenever the work allows.`,
        `Explore the specific services we offer in ${city.name} below. Each links to a dedicated ${city.name} page with local details, typical jobs, and pricing guidance.`,
      ],
      links: SERVICES.map((s) => ({
        label: `${s.name} in ${city.name}`,
        href: `/services/${s.slug}/${city.slug}`,
      })),
    },
    {
      heading: `Neighborhoods we serve in ${city.name}`,
      paragraphs: [
        neighborhoods.length
          ? `We work throughout ${city.name}, including ${neighborhoods.join(', ')}. Housing stock varies between these areas, from newer subdivision builds to older homes with settled doors, aging caulk, and original fixtures, so we ask the right questions up front and arrive with materials that suit the house.`
          : `We work throughout ${city.name}, from newer subdivision builds to older homes with settled doors, aging caulk, and original fixtures, and we arrive with materials that suit the house.`,
        landmarks.length
          ? `As a local team familiar with ${city.name} landmarks like ${landmarks.slice(0, 3).join(', ')}, scheduling is genuinely local: a real arrival time, a confirmation before we head out, and never a travel surcharge.`
          : `As a local team, scheduling is genuinely local: a real arrival time, a confirmation before we head out, and never a travel surcharge.`,
      ],
    },
    {
      heading: `Seasonal home maintenance in ${county}`,
      paragraphs: [
        `The ${county} seasons set the rhythm for home upkeep: gutters want cleaning in late fall before the first freeze, caulking and weatherstripping pay for themselves when refreshed before winter, and fence, deck, and exterior repairs are best done spring through fall while concrete and sealants can cure. Interior work, drywall, paint, plumbing, electrical, and mounting, runs year-round.`,
        seo?.climate
          ? `The local ${seo.climate} is hard on the small stuff - caulk lines crack with freeze-thaw cycles, doors swell and shrink, and exterior finishes fade - which is exactly the work a scheduled handyman visit keeps ahead of.`
          : `The Treasure Valley climate is hard on the small stuff - caulk lines crack with freeze-thaw cycles, doors swell and shrink, and exterior finishes fade - which is exactly the work a scheduled handyman visit keeps ahead of.`,
      ],
    },
  ];

  // Real before/after projects only - no seeded testimonials or star ratings
  // until genuine, verified reviews exist.
  const cityProjects = getGalleryProjectsForCity(city.slug);
  const proof: LandingProof | undefined =
    cityProjects.length > 0
      ? {
          projects: cityProjects.map((p) => ({
            title: p.title,
            description: p.description,
            beforeImageUrl: p.beforeImageUrl,
            afterImageUrl: p.afterImageUrl,
          })),
        }
      : undefined;

  const h1 = `Handyman in ${city.name}, Idaho`;
  const faqs = [
    ...AREA_PAGE_FAQS,
    {
      question: `Do you serve ${city.name}, Idaho?`,
      answer: `Yes. ${city.name} is part of our core Treasure Valley service area. We handle small repairs, installs, and maintenance across the city, with the same upfront quotes and pricing as everywhere else we work.`,
    },
  ];

  const schemas = [
    landingBreadcrumbs([
      { name: 'Home', url: '/' },
      { name: 'Service Areas', url: '/areas' },
      { name: city.name, url: path },
    ]),
    landingAreaBusinessSchema(city.name),
    landingFAQSchema(faqs),
    generateSpeakableSchema({ path, name: h1 }),
  ];

  return (
    <>
      <JsonLd data={schemas} />
      <LandingPageTemplate
        h1={h1}
        speakableSummary={overview}
        overview={overview}
        heroImageUrl={images.hero}
        breatherImageUrl={images.breather}
        processImageUrl={images.process}
        manifestPath={path}
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Service Areas', href: '/areas' },
          { name: city.name },
        ]}
        benefits={[
          `Local service in ${city.name} and ${county}`,
          'One accountable local contact',
          'Upfront quote before any work starts',
          'Most jobs finished in one visit',
        ]}
        localNote={localNote}
        sections={sections}
        proof={proof}
        proofHeading={`Recent ${city.name} jobs`}
        showEstimatePrompt
        faqs={faqs}
        related={{ variant: 'area', citySlug: city.slug }}
      />
    </>
  );
}
