import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Download } from 'lucide-react';
import { buildPageMetadata } from '@/lib/page-metadata';
import { Section } from '@/components/marketing/Section';
import { PermitFlowGraphic } from './PermitFlowGraphic';
import { ConsultCTA } from '@/components/modals/ConsultCTA';
import { CTA_PRIMARY } from '@/shared/ctaCopy';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  generateArticleSchema,
  generateBreadcrumbSchema,
  generateHowToSchema,
} from '@/lib/schema';

const PERMIT_FLOW_DESCRIPTION =
  'When a home repair needs a permit in Ada and Canyon County: what a handyman can do without one, what triggers a permit, and who to call to check.';

export const metadata: Metadata = buildPageMetadata({
  kind: 'blog',
  path: '/resources/ada-canyon-permit-flow',
  titleOverride: 'When Does a Home Repair Need a Permit? Ada & Canyon County | Boise Handyman Co',
  descriptionOverride: PERMIT_FLOW_DESCRIPTION,
});

export default function AdaCanyonPermitFlowPage() {
  const schemas = [
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Resources', url: '/resources' },
      { name: 'When Does a Home Repair Need a Permit?', url: '/resources/ada-canyon-permit-flow' },
    ]),
    generateArticleSchema({
      title: 'When Does a Home Repair Need a Permit? Ada & Canyon County',
      description: PERMIT_FLOW_DESCRIPTION,
      publishedAt: '2026-05-01',
      updatedAt: '2026-08-13',
      slug: 'ada-canyon-permit-flow',
      pathPrefix: 'resources',
    }),
    generateHowToSchema({
      name: 'How to find out whether a home repair needs a permit in Ada or Canyon County',
      description: PERMIT_FLOW_DESCRIPTION,
      url: '/resources/ada-canyon-permit-flow',
      steps: [
        { name: 'Describe the actual work', text: 'Write down exactly what is changing. A like-for-like swap (same faucet location, same fixture type) is treated very differently from moving, adding, or extending plumbing, wiring, or structure.' },
        { name: 'Check the usually-exempt list', text: 'Painting, drywall patching, caulking, like-for-like fixture swaps, cabinet and trim repair, fence repair, and deck board replacement generally do not require a permit. Most handyman-scope work lives here.' },
        { name: 'Check the permit-trigger list', text: 'New circuits or panel work, moved or added plumbing, water heater replacement, structural changes, additions, re-roofs, HVAC replacement, and any gas work generally require permits and often a licensed trade.' },
        { name: 'Confirm your jurisdiction', text: 'Determine whether the home sits inside city limits (Boise, Meridian, Eagle, Kuna, Star, Nampa, Caldwell, Middleton) or in unincorporated Ada or Canyon County, because that decides which building department answers the question.' },
        { name: 'Call and ask before work starts', text: 'A five-minute call to the building department, describing the work precisely, settles borderline cases for free. If a permit is needed, the licensed contractor doing that work normally pulls it.' },
      ],
    }),
  ];

  return (
    <div className="flex flex-col pb-20">
      <JsonLd data={schemas} />
      <Section spacing="lg" className="pt-28 md:pt-32">
        <div className="container px-4 max-w-4xl mx-auto">
          <Link
            href="/resources"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Homeowner resources
          </Link>

          <p className="text-xs font-normal uppercase tracking-wider text-accent-legible mb-3">
            Visual guide
          </p>
          <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-foreground mb-4">
            When does a home repair need a permit in Ada &amp; Canyon County?
          </h1>
          <p className="text-lg text-muted-foreground mb-4 max-w-2xl">
            Most handyman-scope repairs, patching, painting, caulking, and like-for-like fixture
            swaps, need no permit at all. Permits enter the picture when work moves or adds
            wiring, plumbing, or structure. Here is the line, and who to call when a job sits
            near it.
          </p>
          <p className="text-sm text-muted-foreground mb-8 max-w-2xl">
            Rules differ slightly by city and change over time, so treat this as orientation,
            not legal advice: a five-minute call to your building department settles any
            borderline case for free.
          </p>

          <div className="flex flex-wrap gap-3 mb-10">
            <a
              href="/downloads/home-repair-permit-guide.pdf"
              download
              className="inline-flex items-center gap-2 rounded-md bg-accent text-accent-foreground px-4 py-2 text-sm font-normal hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              Download PDF reference
            </a>
            <Link
              href="/blog/ada-vs-canyon-county-permit-timelines"
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm hover:bg-muted/50"
            >
              Read full article
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <PermitFlowGraphic />

          <div className="mt-12 prose-measure text-sm text-muted-foreground space-y-4">
            <p>
              <strong className="text-foreground">HOA note:</strong> communities in Eagle,
              Harris Ranch, Hidden Springs, and many Meridian subdivisions may require
              architectural approval for visible exterior work, fences, paint colors, and the
              like. That approval is separate from any county permit, and it applies even when
              no permit does.
            </p>
            <p>
              <strong className="text-foreground">Where we fit:</strong> our work stays in the
              no-permit lane, repairs, maintenance, and like-for-like swaps. When your project
              crosses into permit territory, it usually also crosses into licensed-trade
              territory, and we will say so at the quote stage and point you toward the right
              contractor.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <ConsultCTA variant="brand">
              {CTA_PRIMARY}
              <ArrowRight className="ml-2 h-4 w-4" />
            </ConsultCTA>
            <Link
              href="/guides/hire-a-handyman-treasure-valley"
              className="inline-flex items-center text-sm text-accent-legible hover:underline"
            >
              How to hire a handyman
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
