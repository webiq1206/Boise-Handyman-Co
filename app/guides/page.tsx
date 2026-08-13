import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, MapPin } from 'lucide-react';
import { buildPageMetadata } from '@/lib/page-metadata';
import { Section } from '@/components/marketing/Section';
import { MarketingCard } from '@/components/marketing/MarketingCard';
import { PageHeroBand } from '@/components/sections/PageHeroBand';
import { EstimatePromptBand } from '@/components/marketing/EstimatePromptBand';
import { CONTENT_HUBS, guidePath } from '@/shared/contentHubs';
import { GUIDE_PAGES, type GuidePageData } from '@/shared/guideContent';
import { getBlogHeroImage, getBlogImageAlt } from '@/shared/blogImages';
import { generateBreadcrumbSchema, generateWebPageSchema } from '@/lib/schema';
import {
  countH2Headings,
  countSubstantiveWords,
  estimateReadingTime,
} from '@/lib/content-utils';

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

export const metadata: Metadata = buildPageMetadata({
  kind: 'blog',
  path: '/guides',
  titleOverride: 'Home Repair & Maintenance Guides | Boise Handyman Co',
  descriptionOverride:
    'In-depth Treasure Valley home repair guides: what small repairs cost, how to hire a handyman, seasonal maintenance, smart small upgrades, and exterior care.',
});

const PILLAR_TYPES = new Set(['hub-pillar', 'master']);

export default function GuidesIndexPage() {
  const pillarGuides = GUIDE_PAGES.filter((g) => PILLAR_TYPES.has(g.guideType));
  const locationGuides = GUIDE_PAGES.filter(
    (g) => g.guideType === 'location' || g.guideType === 'neighborhood',
  );
  const sortedHubs = [...CONTENT_HUBS].sort((a, b) => a.priorityTier - b.priorityTier);

  const webPageSchema = generateWebPageSchema({
    title: 'Home Repair & Maintenance Guides',
    description:
      'In-depth Treasure Valley home repair guides: what small repairs cost, how to hire a handyman, seasonal maintenance, smart small upgrades, and exterior care.',
    url: '/guides',
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <PageHeroBand
        imageSrc={getBlogHeroImage('boise-home-repair-cost-guide')}
        imageAlt={getBlogImageAlt('boise-home-repair-cost-guide')}
      >
        <div className="brc-label text-inverse-muted mb-3">Treasure Valley know-how</div>
        <h1 className="font-sans font-light text-display tracking-tight text-inverse-foreground max-w-3xl mb-4">
          Home Repair &amp; Maintenance Guides
        </h1>
        <p className="text-base md:text-lg text-inverse-foreground/85 max-w-2xl leading-relaxed mb-4">
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pillarGuides.map((guide) => (
              <MarketingCard key={guide.slug} className="p-0 flex flex-col h-full overflow-hidden">
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
            City &amp; neighborhood guides
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {locationGuides.map((guide) => (
              <MarketingCard key={guide.slug} className="p-0 flex flex-col h-full overflow-hidden">
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
                  <p className="text-sm text-muted-foreground flex-1 mb-2 line-clamp-2">
                    {guide.excerpt}
                  </p>
                  <GuideCardStats guide={guide} />
                  <Link
                    href={guidePath(guide.slug)}
                    className="text-sm text-accent-legible hover:underline inline-flex items-center"
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedHubs.map((hub) => (
              <MarketingCard key={hub.hubSlug} className="p-5">
                <h3 className="font-normal mb-1">{hub.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{hub.description}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
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
              </MarketingCard>
            ))}
          </div>
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
    </>
  );
}
