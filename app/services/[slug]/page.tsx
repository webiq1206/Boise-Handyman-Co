import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  LandingPageTemplate,
  type LandingSection,
} from '@/components/seo/LandingPageTemplate';
import { buildPageMetadata } from '@/lib/page-metadata';
import {
  landingBreadcrumbs,
  landingFAQSchema,
  landingServiceSchema,
  landingSpeakable,
} from '@/lib/landing-schema';
import { SERVICE_SLUGS, getServiceBySlug, servicePath } from '@/lib/seo-routes';
import { SERVICE_SEO_CONTENT } from '@/shared/seoContent';
import { generateSpeakableSchema } from '@/lib/schema';
import { getServiceImageSet } from '@/shared/serviceBackgrounds';
import { CITIES } from '@/shared/contentData';
import { getFeaturedGalleryProject } from '@/shared/galleryData';

export function generateStaticParams() {
  return SERVICE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const service = getServiceBySlug(params.slug);
  if (!service) return {};
  return buildPageMetadata({
    kind: 'service',
    serviceName: service.name,
    serviceSlug: service.slug,
    path: servicePath(service.slug),
  });
}

export default function ServicePage({ params }: { params: { slug: string } }) {
  const service = getServiceBySlug(params.slug);
  const content = SERVICE_SEO_CONTENT[params.slug];
  if (!service || !content) notFound();

  const path = servicePath(service.slug);
  const faqs = content.faqs;
  const images = getServiceImageSet(service.slug);
  const featuredProject = getFeaturedGalleryProject(service.slug);
  const serviceLC = service.name.toLowerCase();

  /* Cost guidance is no longer one of the long-form sections: it renders as
     the template's dedicated cost-and-timeline band directly after the hero,
     where the visitor's first question gets answered first. */
  const costGuidance = content.costGuidance
    ? {
        heading: content.costGuidance.heading,
        paragraphs: content.costGuidance.paragraphs,
        links: [
          { label: 'Get an instant estimate', href: '/estimate' },
          { label: 'Book a handyman visit', href: '/contact#consult' },
        ],
      }
    : undefined;

  const sections: LandingSection[] = [
    ...(content.typicalJobs?.length
      ? [
          {
            heading: `Typical ${serviceLC} jobs`,
            paragraphs: [
              `The calls we get for ${serviceLC} look like this: ${content.typicalJobs.join('; ')}. If your job sounds like one of these, it is squarely in scope. If it is bigger, we will say so upfront and point you to the right specialty contractor instead of stretching a handyman visit around it.`,
            ],
          },
        ]
      : []),
    {
      heading: `${service.name} across the Treasure Valley`,
      paragraphs: [
        `We provide ${serviceLC} throughout the Treasure Valley, with dedicated local pages for each city we serve. The same upfront quotes and flat trip fee apply everywhere in Ada and Canyon County, so where you live never inflates the price.`,
        `Choose your city below for local ${serviceLC} details, or send photos of the job for an upfront quote.`,
      ],
      links: CITIES.map((c) => ({
        label: `${service.name} in ${c.name}`,
        href: `/services/${service.slug}/${c.slug}`,
      })),
    },
    {
      heading: `Why book a handyman for ${serviceLC}`,
      paragraphs: [
        `Specialty contractors are built for big projects, which is why small ${serviceLC} jobs get ignored, wait weeks, or carry minimum charges out of proportion to the work. A handyman service is built the other way: small jobs are the whole business, so they get quoted quickly, scheduled promptly, and finished in one visit whenever the work allows.`,
        // The pricing model, inclusions, and one-trip framing are already
        // stated as scannable bullets above (benefits/inclusions) - this
        // paragraph adds only what those lists don't: the honest-scope close.
        `And when a job genuinely needs a licensed specialty contractor, we say so and refer you to one, rather than learning on your house.`,
      ],
    },
    ...(content.outOfScope
      ? [
          {
            heading: content.outOfScope.heading,
            paragraphs: content.outOfScope.paragraphs,
          },
        ]
      : []),
  ];

  const schemas = [
    landingBreadcrumbs([
      { name: 'Home', url: '/' },
      { name: 'Services', url: '/services' },
      { name: service.name, url: path },
    ]),
    landingServiceSchema(service.name, content.overview),
    landingFAQSchema(faqs),
    generateSpeakableSchema({ path, name: content.headline }),
  ];

  return (
    <>
      <JsonLd data={schemas} />
      <LandingPageTemplate
        h1={content.headline}
        speakableSummary={content.overview}
        overview={content.overview}
        heroImageUrl={images.hero}
        breatherImageUrl={images.breather}
        processImageUrl={images.process}
        manifestPath={path}
        planningFrom={service.planningFrom}
        costGuidance={costGuidance}
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Services', href: '/services' },
          { name: service.name },
        ]}
        benefits={content.benefits}
        inclusions={content.inclusions}
        timeline={content.timeline}
        processSteps={content.processSteps}
        sections={sections}
        featuredProject={featuredProject}
        showEstimatePrompt
        faqs={faqs}
        related={{ variant: 'service', serviceSlug: service.slug }}
      />
    </>
  );
}
