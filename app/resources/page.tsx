import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Download, FileText, Workflow } from 'lucide-react';
import { buildPageMetadata } from '@/lib/page-metadata';
import { Section } from '@/components/marketing/Section';
import { MarketingCard } from '@/components/marketing/MarketingCard';
import { ALL_RESOURCES_LIST } from '@/shared/guideResources';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  generateBreadcrumbSchema,
  generateCollectionPageSchema,
} from '@/lib/schema';

export const metadata: Metadata = buildPageMetadata({
  kind: 'blog',
  path: '/resources',
  titleOverride: 'Home Repair & Maintenance Resources | Boise Handyman Co',
  descriptionOverride:
    'Free PDF checklists and visual guides for Treasure Valley homeowners: seasonal maintenance checklist, repair priority worksheet, and the repair permit guide.',
});

export default function ResourcesIndexPage() {
  const pdfs = ALL_RESOURCES_LIST.filter((r) => r.kind === 'pdf');
  const visuals = ALL_RESOURCES_LIST.filter((r) => r.kind === 'visual');

  const schemas = [
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Resources', url: '/resources' },
    ]),
    generateCollectionPageSchema({
      title: 'Home Repair & Maintenance Resources',
      description:
        'Free PDF checklists and visual guides for Treasure Valley homeowners: seasonal maintenance checklist, repair priority worksheet, and the repair permit guide.',
      url: '/resources',
      items: ALL_RESOURCES_LIST.map((r) => ({
        name: r.title,
        url: r.href,
      })),
    }),
  ];

  return (
    <Section spacing="lg" className="pt-28 md:pt-32">
      <JsonLd data={schemas} />
      <div className="container px-4 max-w-4xl mx-auto">
        <p className="text-xs font-normal uppercase tracking-wider text-accent-legible mb-3">
          Free downloads
        </p>
        <h1 className="text-3xl md:text-4xl font-sans font-light tracking-tight text-foreground mb-4">
          Home repair &amp; maintenance resources
        </h1>
        <p className="text-lg text-muted-foreground mb-5 max-w-2xl">
          Printable PDFs and visual guides to use alongside our{' '}
          <Link href="/guides" className="text-accent-legible hover:underline">
            home repair guides
          </Link>
          . These are planning tools - not quotes or contracts.
        </p>
        <p className="text-base text-muted-foreground mb-4 max-w-2xl leading-relaxed">
          The maintenance checklist is the season-by-season routine that keeps Treasure Valley
          homes ahead of freeze-thaw winters and high-desert summers. The repair priority
          worksheet helps you walk the house, triage what you find, and decide what to DIY,
          what to batch into one visit, and what needs a licensed trade. And the permit guide
          answers the question homeowners ask us most: which repairs need a permit in Ada and
          Canyon County, and which do not.
        </p>
        <p className="text-base text-muted-foreground mb-12 max-w-2xl leading-relaxed">
          All free, no email required. When your list is ready,{' '}
          <Link href="/contact" className="text-accent-legible hover:underline">
            send it over with photos
          </Link>{' '}
          and we will turn it into a flat quote and a one-trip plan.
        </p>

        <h2 className="text-sm font-normal uppercase tracking-wider text-muted-foreground mb-4">
          PDF checklists &amp; worksheets
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 mb-12">
          {pdfs.map((r) => (
            <MarketingCard key={r.id} className="p-5 flex flex-col h-full">
              <FileText className="h-5 w-5 text-accent-legible mb-3" />
              <h3 className="font-normal mb-2">{r.title}</h3>
              <p className="text-sm text-muted-foreground flex-1 mb-4">{r.description}</p>
              <a
                href={r.href}
                download
                className="inline-flex items-center text-sm text-accent-legible hover:underline font-normal"
              >
                <Download className="h-4 w-4 mr-1" />
                Download PDF
              </a>
            </MarketingCard>
          ))}
        </div>

        <h2 className="text-sm font-normal uppercase tracking-wider text-muted-foreground mb-4">
          Visual guides
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {visuals.map((r) => (
            <MarketingCard key={r.id} className="p-5 flex flex-col h-full">
              <Workflow className="h-5 w-5 text-accent-legible mb-3" />
              <h3 className="font-normal mb-2">{r.title}</h3>
              <p className="text-sm text-muted-foreground flex-1 mb-4">{r.description}</p>
              <Link
                href={r.href}
                className="inline-flex items-center text-sm text-accent-legible hover:underline font-normal"
              >
                View guide
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </MarketingCard>
          ))}
        </div>

        <p className="text-sm text-muted-foreground mt-12 text-center">
          <Link href="/guides/boise-home-repair-cost-guide" className="text-accent-legible hover:underline">
            Start with the cost guide
          </Link>
          {' · '}
          <Link href="/contact" className="text-accent-legible hover:underline">
            Get a flat quote
          </Link>
        </p>
      </div>
    </Section>
  );
}
