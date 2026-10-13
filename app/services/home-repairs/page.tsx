import type { Metadata } from 'next';
import Link from 'next/link';
import { InteriorHero, InteriorPage } from '@/components/approved/InteriorLayout';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Section } from '@/components/marketing/Section';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildCanonical } from '@/lib/page-metadata';
import { generateBreadcrumbSchema } from '@/lib/schema';
import { SERVICES } from '@/shared/contentData';

const title = 'Home Repairs in Boise & the Treasure Valley';
const description = 'Get help with drywall, doors, trim, fixtures and a household repair list. Share what needs attention or request a call from Boise Handyman Co.';
export const metadata: Metadata = {
  title: { absolute: `${title} | Boise Handyman Co` },
  description,
  alternates: { canonical: buildCanonical('/services/home-repairs') },
  openGraph: { title, description, url: buildCanonical('/services/home-repairs'), type: 'website' },
};

export default function HomeRepairsPage() {
  return <InteriorPage kind="services">
    <JsonLd data={generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Services', url: '/services' },
      { name: 'Home Repairs', url: '/services/home-repairs' },
    ])}/>
    <InteriorHero layout="editorial">
      <Breadcrumbs items={[{name:'Home',href:'/'},{name:'Services',href:'/services'},{name:'Home Repairs'}]}/>
      <p className="ed-eyebrow mt-8">Boise Handyman Co</p>
      <h1 className="ed-display ed-statement-display text-inverse-foreground">Home repairs. Your list, handled.</h1>
      <p className="ed-lede mt-8 max-w-[44ch] text-inverse-foreground/85">A sticking door, damaged drywall, loose trim or several small jobs: tell us what needs attention. We’ll review your list and confirm the scope before scheduling.</p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link className="underline underline-offset-4" href="/estimate">Start my repair request</Link>
        <Link className="underline underline-offset-4" href="/contact">Prefer to talk? Contact us</Link>
      </div>
    </InteriorHero>
    <Section surface="bone" spacing="xl" edge>
      <div className="ed-shell">
        <h2 className="ed-h2">One job or a whole repair list</h2>
        <p className="ed-body mt-4">Share photos if you have them, or start with a short description. If a job needs a specialty contractor, we’ll explain the next step rather than promise work outside our scope.</p>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2">
          {SERVICES.map(service=><li key={service.slug}><h3 className="font-semibold"><Link className="underline underline-offset-4" href={`/services/${service.slug}`}>{service.name}</Link></h3><p className="mt-2">{service.shortDescription}</p></li>)}
        </ul>
        <div className="mt-10 flex flex-wrap gap-6"><Link className="underline underline-offset-4" href="/estimate">Tell us about your repairs</Link><a className="underline underline-offset-4" href="tel:+12084771169">Call (208) 477-1169</a></div>
      </div>
    </Section>
  </InteriorPage>;
}
