import { InteriorPage } from '@/components/approved/InteriorLayout';
import { EstimatePromptBand } from '@/components/marketing/EstimatePromptBand';
import { MarketingCard } from '@/components/marketing/MarketingCard';
import { Section } from '@/components/marketing/Section';
import Image from '@/components/MarketingImage';
import { PageHeroBand } from '@/components/sections/PageHeroBand';
import { withBrandPageMetadata } from '@/lib/brand-page-metadata';
import {
countH2Headings,
countSubstantiveWords,
estimateReadingTime,
} from '@/lib/content-utils';
import { buildPageMetadata } from '@/lib/page-metadata';
import { generateBreadcrumbSchema,generateWebPageSchema } from '@/lib/schema';
import { getBlogHeroImage,getBlogImageAlt } from '@/shared/blogImages';
import { CONTENT_HUBS,guidePath } from '@/shared/contentHubs';
import { GUIDE_PAGES,type GuidePageData } from '@/shared/guideContent';
import { ArrowRight,BookOpen,MapPin } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

function guideCardMeta(guide: GuidePageData) {
  const words = countSubstantiveWords(guide.content);
  const topics = countH2Headings(guide.content);
  const minutes = estimateReadingTime(words);
  return { minutes, topics };
}

function GuideCardStats({ guide }: { guide: GuidePageData }) {
  const { minutes, topics } = guideCardMeta(guide);
  return (
    <p className="text-xs text-muted-foreground mb-4">
      {topics} topics · {minutes} min read
    </p>
  );
}

export const metadata: Metadata = withBrandPageMetadata((buildPageMetadata({
  kind: 'blog',
  path: '/guides',
  titleOverride: 'Home Repair & Maintenance Guides | Boise Handyman Co',
  descriptionOverride:
    'In-depth Treasure Valley home repair guides: what small repairs cost, how to hire a handyman, seasonal maintenance, small upgrades and exterior care.',
})), "/guides");

const PILLAR_TYPES = new Set(['hub-pillar', 'master']);

export default function GuidesIndexPage() {
  const pillarGuides = GUIDE_PAGES.filter((g) => PILLAR_TYPES.has(g.guideType));
  // Seven pillars: one featured across the row, then 3x2. Eight city guides
  // as 4x2 and three neighborhood guides as 3x1. As one grid of eleven they
  // ended in two stretched half-width cards; seven ended in a lone centred one.
  const [featuredGuide, ...otherPillars] = pillarGuides;
  const cityGuides = GUIDE_PAGES.filter((g) => g.guideType === 'location');
  const neighborhoodGuides = GUIDE_PAGES.filter((g) => g.guideType === 'neighborhood');
  const sortedHubs = [...CONTENT_HUBS].sort((a, b) => a.priorityTier - b.priorityTier);

  const webPageSchema = generateWebPageSchema({
    title: 'Home repair & maintenance guides',
    description:
      'In-depth Treasure Valley home repair guides: what small repairs cost, how to hire a handyman, seasonal maintenance, smart small upgrades, and exterior care.',
    url: '/guides',
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides' },
  ]);

  return (
    <InteriorPage kind="guides"><>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <PageHeroBand
        /* Not the cost guide's own photo: that guide is the featured card just
           below, and the estimate clipboard is also the warranty page hero. */
        imageSrc="/images/handyman/punch-list-markers.webp"
        imageAlt="Blue painter's tape marking touch-up spots on a wall and window trim"
      >
        <p className="ed-eyebrow mt-8" style={{ color: "rgb(255 255 255 / 0.72)" }}>Treasure Valley know-how</p>
        <h1 className="ed-display ed-statement-display text-inverse-foreground">
          Home repair &amp; maintenance guides
        </h1>
        <p className="ed-lede mt-8 max-w-[44ch] text-inverse-foreground/85">
          In-depth guides for Boise, Meridian, Eagle, Nampa, and the rest of the Treasure Valley.
          What small repairs cost here, how to hire well, what each season demands, and which
          fixes to do before they get expensive.
        </p>
        <Link
          href="/resources"
          className="text-sm text-inverse-foreground/90 hover:text-inverse-foreground inline-flex items-center transition-colors"
        >
          Free PDF checklists &amp; permit guide
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </PageHeroBand>

      <Section spacing="default" className="pt-12 md:pt-16">
        <div className="container px-4 max-w-6xl mx-auto mb-16">
          <h2 className="text-sm font-normal uppercase tracking-wider text-muted-foreground mb-6">
            Cornerstone guides
          </h2>
          {featuredGuide && (
            <MarketingCard padding="none" className="mb-6 grid overflow-hidden md:grid-cols-2">
              <div className="relative aspect-[16/9] overflow-hidden md:aspect-auto md:min-h-[320px]">
                <Image
                  src={getBlogHeroImage(featuredGuide.slug, featuredGuide.heroImage)}
                  alt={getBlogImageAlt(featuredGuide.slug)}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover img-brand-grade"
                />
              </div>
              <div className="p-6 md:p-8 flex flex-col">
                <BookOpen className="h-5 w-5 text-accent-legible mb-3" />
                <h3 className="font-normal text-xl mb-2">{featuredGuide.title}</h3>
                <p className="text-sm text-muted-foreground flex-1 mb-3">{featuredGuide.excerpt}</p>
                <GuideCardStats guide={featuredGuide} />
                <Link
                  href={guidePath(featuredGuide.slug)}
                  className="inline-flex items-center text-sm text-accent-legible hover:underline"
                >
                  Read guide
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </MarketingCard>
          )}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {otherPillars.map((guide) => (
              <MarketingCard key={guide.slug} padding="none" className="flex flex-col h-full overflow-hidden">
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={getBlogHeroImage(guide.slug, guide.heroImage)}
                    alt={getBlogImageAlt(guide.slug)}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover img-brand-grade"
                  />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <BookOpen className="h-5 w-5 text-accent-legible mb-3" />
                  <h3 className="font-normal text-lg mb-2">{guide.title}</h3>
                  <p className="text-sm text-muted-foreground flex-1 mb-3">{guide.excerpt}</p>
                  <GuideCardStats guide={guide} />
                  <Link
                    href={guidePath(guide.slug)}
                    className="inline-flex items-center text-sm text-accent-legible hover:underline"
                  >
                    Read guide
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </MarketingCard>
            ))}
          </div>
        </div>

        <div className="container px-4 max-w-6xl mx-auto mb-16">
          <h2 className="text-sm font-normal uppercase tracking-wider text-muted-foreground mb-6">
            City guides
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cityGuides.map((guide) => (
              <MarketingCard key={guide.slug} padding="none" className="flex flex-col h-full overflow-hidden">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={getBlogHeroImage(guide.slug, guide.heroImage)}
                    alt={getBlogImageAlt(guide.slug)}
                    fill
                    sizes="(max-width: 640px) 100vw, 25vw"
                    className="object-cover img-brand-grade"
                  />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <MapPin className="h-4 w-4 text-accent-legible mb-2" />
                  <h3 className="font-normal text-base mb-1">{guide.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {guide.excerpt}
                  </p>
                  <GuideCardStats guide={guide} />
                  <Link
                    href={guidePath(guide.slug)}
                    className="mt-auto text-sm text-accent-legible hover:underline inline-flex items-center"
                  >
                    Read
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </MarketingCard>
            ))}
          </div>
        </div>

        <div className="container px-4 max-w-6xl mx-auto mb-16">
          <h2 className="text-sm font-normal uppercase tracking-wider text-muted-foreground mb-6">
            Neighborhood guides
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {neighborhoodGuides.map((guide) => (
              <MarketingCard key={guide.slug} padding="none" className="flex flex-col h-full overflow-hidden">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={getBlogHeroImage(guide.slug, guide.heroImage)}
                    alt={getBlogImageAlt(guide.slug)}
                    fill
                    sizes="(max-width: 640px) 100vw, 25vw"
                    className="object-cover img-brand-grade"
                  />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <MapPin className="h-4 w-4 text-accent-legible mb-2" />
                  <h3 className="font-normal text-base mb-1">{guide.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {guide.excerpt}
                  </p>
                  <GuideCardStats guide={guide} />
                  <Link
                    href={guidePath(guide.slug)}
                    className="mt-auto text-sm text-accent-legible hover:underline inline-flex items-center"
                  >
                    Read
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </MarketingCard>
            ))}
          </div>
        </div>

        <div className="container px-4 max-w-6xl mx-auto">
          <h2 className="text-sm font-normal uppercase tracking-wider text-muted-foreground mb-6">
            Browse by topic
          </h2>
          {/* Five topics as a ruled list: as cards they ran 3 + 2 stretched. */}
          <ul className="border-t" style={{ borderColor: 'var(--ed-line)' }}>
            {sortedHubs.map((hub) => (
              <li
                key={hub.hubSlug}
                className="grid gap-2 border-b py-5 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto] lg:items-baseline lg:gap-8"
                style={{ borderColor: 'var(--ed-line)' }}
              >
                <h3 className="font-normal">{hub.title}</h3>
                <p className="text-sm text-muted-foreground">{hub.description}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm lg:justify-end">
                  <Link
                    href={guidePath(hub.pillarSlug)}
                    className="text-accent-legible hover:underline inline-flex items-center"
                  >
                    Pillar guide
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                  <Link
                    href={`/blog/category/${hub.hubSlug}`}
                    className="text-muted-foreground hover:text-accent-legible hover:underline"
                  >
                    Related articles
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <EstimatePromptBand
        eyebrow="From reading to fixing"
        title={
          <>
            Turn your repair list into a{' '}
            <em className="brc-accent">flat quote</em>
          </>
        }
        description="Read enough to know what your house needs? Send us the list with a few photos and we will reply with a flat, upfront quote - most small jobs are scheduled within the week and done in one trip."
        variant="canvas"
      />
    </></InteriorPage>
  );
}
