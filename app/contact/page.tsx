import { InteriorEstimateLink,InteriorHero,InteriorPage } from '@/components/approved/InteriorLayout';
import { BusinessPhoneContact } from '@/components/BusinessPhoneContact';
import { LazyConsultationForm as ConsultationForm } from '@/components/LazyConsultationForm';
import { QuoteFormAnchor } from '@/components/QuoteFormAnchor';
import { Section } from '@/components/marketing/Section';
import { Hairline } from '@/components/marketing/Hairline';
import { MarketingCard } from '@/components/marketing/MarketingCard';
import { SectionHeader } from '@/components/marketing/SectionHeader';
import Image from '@/components/MarketingImage';
import { ConsultCTA } from '@/components/modals/ConsultCTA';
import { Reveal } from '@/components/Reveal';
import { SaveContactLink } from '@/components/SaveContactLink';
import { StatementBandSection } from '@/components/sections/StatementBandSection';
import { JsonLd } from '@/components/seo/JsonLd';
import {
Accordion,
AccordionContent,
AccordionItem,
AccordionTrigger,
} from '@/components/ui/accordion';
import { withBrandPageMetadata } from '@/lib/brand-page-metadata';
import { buildPageMetadata } from '@/lib/page-metadata';
import {
generateBreadcrumbSchema,
generateFAQSchema,
generateLocalBusinessSchema,
generateWebPageSchema,
} from '@/lib/schema';
import { BUSINESS_INFO } from '@/lib/seo';
import { areaPath } from '@/lib/seo-routes';
import { CITIES,TREASURE_VALLEY_CITIES } from '@/shared/contentData';
import { CTA_PRIMARY,CTA_SECONDARY } from '@/shared/ctaCopy';
import { PUBLIC_NAP_LINE, SITE_CONFIG } from '@/shared/siteConfig';
import { CONSULT_BULLETS,HERO_STATS } from '@/shared/siteContent';
import { SITE_IMAGES } from '@/shared/siteImages';
import { ArrowRight,Check,ChevronRight,Mail,MapPin,MessageSquare,Phone } from 'lucide-react';
import Link from 'next/link';
import { FamilyButton } from '@/components/family/Button';

const CONTACT_FAQS = [
  {
    question: 'How quickly will you respond to my inquiry?',
    answer:
      'Call or text to discuss your project, or send the form with optional photos. The team reviews the scope, prepares a written quote and confirms availability before scheduling.',
  },
  {
    question: 'Are quotes really free?',
    answer:
      'Yes. Send your task list with photos and we quote it at no charge and with no obligation. The quote states one clear price and the expected time, so you know the cost before anything is scheduled.',
  },
  {
    question: 'What should I include when I reach out?',
    answer:
      'A short description of each task and a photo or two of each one. Photos help us review the scope, identify materials and confirm the visit plan.',
  },
  {
    question: 'What areas do you serve?',
    answer: `We work in ${TREASURE_VALLEY_CITIES}, and surrounding Treasure Valley communities across Ada and Canyon County. Where you live in the service area never inflates the quote.`,
  },
  {
    question: 'Can I book more than one task in a visit?',
    answer:
      'Please do. The team reviews the whole list and confirms the number of visits, materials and price. Send the full list when you book so we bring the right materials.',
  },
  {
    question: 'How do I get a cost estimate for my job?',
    answer:
      'Send photos and your task list. We review the scope before preparing a written quote. Nothing is scheduled until you approve.',
  },
];

const SPEAKABLE_SUMMARY =
  `Contact ${SITE_CONFIG.name} for a written handyman quote. Send your task list with photos, or call or text our team. You get one written price before work starts.`;

function HeroBreadcrumbs() {
  const items = [
    { name: 'Home', href: '/' },
    { name: 'Contact' },
  ];

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-inverse-foreground/80">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.name} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-inverse-foreground transition-colors"
                >
                  {item.name}
                </Link>
              ) : (
                <span className={isLast ? 'text-inverse-foreground font-normal' : ''}>
                  {item.name}
                </span>
              )}
              {!isLast && (
                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 opacity-40" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

interface ContactChannelProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  external?: boolean;
  children: React.ReactNode;
  subtext: string;
  featured?: boolean;
  /** Rendered below the card, outside any link wrapper (e.g. save-to-contacts). */
  companion?: React.ReactNode;
}

function ContactChannel({
  icon,
  label,
  href,
  external,
  children,
  subtext,
  featured,
  companion,
}: ContactChannelProps) {
  const inner = (
    <MarketingCard
      className={`h-full transition-colors ${
        href ? 'group-hover:border-foreground/25' : ''
      } ${featured ? 'md:p-10' : ''}`}
      padding={featured ? 'lg' : 'default'}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm bg-accent-legible/10 text-accent-legible">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="ed-eyebrow !mb-2">{label}</p>
          <div
            className={`text-foreground ${featured ? 'text-xl md:text-2xl' : 'text-base'} ${
              href ? 'group-hover:text-foreground/70 transition-colors' : ''
            }`}
          >
            {children}
          </div>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{subtext}</p>
        </div>
      </div>
    </MarketingCard>
  );

  if (href) {
    return (
      <div className="h-full">
        <a
          href={href}
          className="block h-full group"
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {inner}
        </a>
        {companion ? <div className="mt-2 pl-14">{companion}</div> : null}
      </div>
    );
  }

  return inner;
}

export const metadata = withBrandPageMetadata((buildPageMetadata({
  kind: 'contact',
  path: '/contact',
})), "/contact");

export default function ContactPage() {
  const schemas = [
    generateLocalBusinessSchema(),
    generateWebPageSchema({
      title: `Contact ${SITE_CONFIG.name}`,
      description:
        'Book a handyman visit or get an upfront quote from our Treasure Valley handyman team.',
      url: '/contact',
      speakable: true,
    }),
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Contact', url: '/contact' },
    ]),
    generateFAQSchema(CONTACT_FAQS),
  ];

  return (
    <InteriorPage kind="contact"><>
      <JsonLd data={schemas} />
      <div className="flex flex-col ">
        {/* Approved editorial hero */}
        <InteriorHero layout="contact" imageSrc={SITE_IMAGES.consultBg} imageAlt="A freshly painted sage-green front door with white trim and black hardware">
            <HeroBreadcrumbs />
            <p data-speakable="summary" className="sr-only">
              {SPEAKABLE_SUMMARY}
            </p>
            <p className="ed-eyebrow" style={{ color: "rgb(255 255 255 / 0.72)" }}>Get in touch</p>
            <h1 className="ed-display ed-statement-display text-inverse-foreground mb-8">
              Contact Boise Handyman{' '}
              <em className="brc-accent">Co</em>
            </h1>
            <p className="text-base md:text-lg text-inverse-foreground/85 max-w-2xl leading-relaxed mb-6">
              Send your task list with photos for an upfront quote, or call or text our team to
              explore a range for your repair, install, or maintenance job.
            </p>
            {/* One support line, then the primary, so it sits in the first
                screen at 360x640. The phone and text links follow the CTA. */}
            <div className="interior-contact-actions" data-hero-cta="primary"><InteriorEstimateLink label="Send your list and photos" href="/contact#consult"/><a href="#consult" className="interior-text-link">Request a handyman visit</a></div>
            <BusinessPhoneContact
              layout="stack"
              display
              phoneClassName="text-2xl md:text-3xl text-inverse-foreground hover:text-inverse-foreground/75 transition-colors"
              saveClassName="text-sm text-inverse-foreground/80 hover:text-inverse-foreground transition-colors"
              phoneTestId="link-hero-phone"
            />
            <a
              href={SITE_CONFIG.phoneSmsHref}
              className="block text-sm text-inverse-foreground/80 hover:text-inverse-foreground transition-colors mb-8"
              data-testid="link-hero-text"
            >
              Prefer to text? Message us instead
            </a>
            <dl className="ed-hero-facts">
              {HERO_STATS.map((stat) => (
                <div key={stat.label}>
                  <dt>{stat.label}</dt>
                  <dd>{stat.num}</dd>
                </div>
              ))}
            </dl>
          </InteriorHero>

        {/* ─── Inline consultation form ─── */}
        <Section divider reveal={false}>
          <div className="container px-4">
            <div className="interior-contact-grid quote-form-first">
              <div className="interior-contact-intro">
                <Reveal>
                  <p className="ed-eyebrow">Book your visit</p>
                  <h2 className="ed-h2 ed-statement-wide">
                    Tell us what needs{' '}
                    <em className="brc-accent">fixing</em>.
                  </h2>
                  <p className="text-base leading-relaxed mb-8 text-muted-foreground">
                    Send your repair list and optional photos. The team reviews the scope,
                    prepares a written quote and confirms availability before scheduling,
                    with no obligation.
                  </p>
                </Reveal>
              </div>
              {/* Every "#consult" link lands here, on the form itself (QuoteFormAnchor). */}
              <div id="consult" data-quote-anchor="" className="interior-contact-form">
                <QuoteFormAnchor />
                <MarketingCard className="p-4 sm:p-7 md:p-10" padding="lg">
                  <ConsultationForm />
                </MarketingCard>
              </div>
            </div>
          </div>
        </Section>

        {/* ─── Contact channels ─── */}
        <Section variant="greige" divider>
          <div className="container px-4 max-w-5xl">
            <SectionHeader
              eyebrow="Reach us directly"
              size="display"
              title={
                <>
                  Every way to{' '}
                  <em className="brc-accent">connect</em>
                </>
              }
              description="Call, text, or email to discuss your repair list and next steps, with no pressure."
              className="max-w-3xl"
            />
            <div className="ed-grid-balance grid sm:grid-cols-2 gap-4">
              <Reveal className="sm:col-span-2">
                <ContactChannel
                  icon={<Phone className="h-5 w-5" strokeWidth={1.5} />}
                  label="Call us"
                  href={SITE_CONFIG.phoneHref}
                  subtext="Mon – Fri 9 am – 6 pm · Sat 9 am – 4 pm"
                  featured
                  companion={
                    <SaveContactLink className="text-sm text-muted-foreground hover:text-foreground transition-colors" />
                  }
                >
                  <span className="brc-display-num tabular-nums">{BUSINESS_INFO.phone}</span>
                </ContactChannel>
              </Reveal>
              <Reveal delay={30} className="sm:col-span-2">
                <ContactChannel
                  icon={<MessageSquare className="h-5 w-5" strokeWidth={1.5} />}
                  label="Text us"
                  href={SITE_CONFIG.phoneSmsHref}
                  subtext="Quick questions? Send us a text"
                  companion={
                    <SaveContactLink className="text-sm text-muted-foreground hover:text-foreground transition-colors" />
                  }
                >
                  <span className="brc-display-num tabular-nums">{BUSINESS_INFO.phone}</span>
                </ContactChannel>
              </Reveal>
              <Reveal delay={90}>
                <ContactChannel
                  icon={<Mail className="h-5 w-5" strokeWidth={1.5} />}
                  label="Email us"
                  href={`mailto:${BUSINESS_INFO.email}`}
                  subtext="Scope and availability confirmed after review"
                >
                  <span>{BUSINESS_INFO.email}</span>
                </ContactChannel>
              </Reveal>
              <Reveal delay={120}>
                <ContactChannel
                  icon={<MapPin className="h-5 w-5" strokeWidth={1.5} />}
                  label="Where we work"
                  subtext={SITE_CONFIG.address.serviceArea}
                >
                  <address className="not-italic leading-relaxed">
                    {PUBLIC_NAP_LINE}
                  </address>
                </ContactChannel>
              </Reveal>
              <Reveal delay={180} className="sm:col-span-2">
                <ContactChannel
                  icon={<MapPin className="h-5 w-5" strokeWidth={1.5} />}
                  label="Service area"
                  subtext="The same fair pricing across the whole Treasure Valley"
                >
                  <span className="text-sm leading-relaxed">{TREASURE_VALLEY_CITIES}</span>
                </ContactChannel>
              </Reveal>
            </div>
          </div>
        </Section>

        {/* ─── What to expect split ─── */}
        <Section variant="canvas" spacing="none" divider className="p-0">
          <div className="grid md:grid-cols-2 overflow-hidden">
            <div className="bg-inverse order-2 md:order-1">
              {/* People photo: contain / intrinsic - never cover-crop heads or bodies */}
              <Image
                src={SITE_IMAGES.leadership}
                alt="A handyman and a homeowner reviewing a clipboard at a front door"
                width={1461}
                height={1076}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="h-auto w-full"
                style={{ objectFit: "contain" }}
              />
              <div className="px-8 py-8 md:px-12 md:py-10">
                <p className="ed-eyebrow text-muted-foreground">Your quote includes</p>
                <p className="font-sans font-light text-xl md:text-2xl text-foreground">
                  No pressure. No pitch. Just answers.
                </p>
              </div>
            </div>

            <div className="section-y-sm px-8 md:px-14 lg:px-16 bg-card border-l border-border order-1 md:order-2">
              <Reveal>
                <SectionHeader
                  eyebrow="What to expect"
                  title={
                    <>
                      No pressure. No pitch.{' '}
                      <em className="brc-accent">Just answers.</em>
                    </>
                  }
                  description="Your quote states what the job will actually cost and how long it will take - one written price and the expected time - not a commission-driven pitch."
                  className="mb-8 max-w-none"
                />
                <ul className="flex flex-col gap-0 mb-8">
                  {CONSULT_BULLETS.map((bullet, i) => (
                    <li key={bullet}>
                      <div className="flex items-start gap-3 py-4">
                        <Check className="h-4 w-4 text-accent-legible flex-shrink-0 mt-0.5" />
                        <span className="text-base text-foreground">{bullet}</span>
                      </div>
                      {i < CONSULT_BULLETS.length - 1 && (
                        <Hairline spaced={false} className="my-0" />
                      )}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                  <ConsultCTA variant="brand">{CTA_PRIMARY}</ConsultCTA>
                  <FamilyButton href="#consult" variant="secondary">{CTA_SECONDARY}</FamilyButton>
                </div>
              </Reveal>
            </div>
          </div>
        </Section>

        {/* ─── Contact FAQ ─── */}
        <Section variant="greige" divider>
          <div className="container px-4 max-w-3xl">
            <Reveal>
              <p className="ed-eyebrow">Common questions</p>
              <h2 className="ed-h2 ed-statement-wide mb-10">
                Before you <em className="brc-accent">reach out</em>
              </h2>
              <Accordion type="single" collapsible className="w-full">
                {CONTACT_FAQS.map((faq, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="border-0 border-t border-border"
                  >
                    <AccordionTrigger className="text-left py-5 hover:no-underline font-sans font-normal text-sm text-foreground">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed pb-6 text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          </div>
        </Section>

        <StatementBandSection />


        {/* ─── Service areas ─── */}
        <Section divider>
          <div className="container px-4 max-w-5xl">
            <SectionHeader
              eyebrow="Treasure Valley"
              size="display"
              title={
                <>
                  Where we <em className="brc-accent">work</em>
                </>
              }
              description={`We handle repairs, installs, and maintenance for homeowners in ${TREASURE_VALLEY_CITIES}, and surrounding communities.`}
              className="max-w-3xl"
            />
            <nav aria-label="Service areas" className="grid grid-cols-2 sm:grid-cols-3 border-t border-l border-border">
              {CITIES.map((city) => (
                <Link
                  key={city.slug}
                  href={areaPath(city.slug)}
                  className="flex min-h-14 items-center justify-between gap-3 border-b border-r border-border px-4 py-3 text-sm text-foreground transition-colors hover:bg-card focus-visible:bg-card last:col-span-2 sm:last:col-span-1"
                >
                  {city.name}
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </Link>
              ))}
            </nav>
          </div>
        </Section>

        {/* ─── Closing CTA ─── */}
        <Section surface="gradient" spacing="xl" edge>
          <div className="ed-shell">
            <Reveal>
              <div className="ed-split ed-split-center">
                <h2 className="ed-h2-sm ed-statement-wide">
                  Prefer to talk first?
                </h2>
              <div>
                <p className="ed-body">
                  Call us directly - no phone tree, no sales scripts.
                </p>
                <BusinessPhoneContact
                  layout="stack"
                  display
                  className="mb-2"
                  phoneClassName="text-2xl text-inverse-foreground hover:text-inverse-foreground/75 transition-colors"
                  saveClassName="text-sm text-inverse-foreground/80 hover:text-inverse-foreground transition-colors"
                  phoneTestId="link-closing-phone"
                />
                <a
                  href={SITE_CONFIG.phoneSmsHref}
                  className="ed-link mt-4 block w-fit"
                  data-testid="link-closing-text"
                >
                  Or send us a text message
                </a>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4 [&>*]:w-full sm:[&>*]:w-auto">
                  <ConsultCTA variant="brand" tone="dark">{CTA_PRIMARY}</ConsultCTA>
                  <FamilyButton href="#consult" variant="secondary" tone="dark">{CTA_SECONDARY}</FamilyButton>
                </div>

              </div></div>
            </Reveal>
          </div>
        </Section>
      </div>
    </></InteriorPage>
  );
}
