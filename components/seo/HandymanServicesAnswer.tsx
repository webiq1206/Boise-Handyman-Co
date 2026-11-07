import { ArrowUpRight } from 'lucide-react';
import { CITIES, SERVICES } from '@/shared/contentData';
import { serviceCityAnchor } from '@/lib/seo';
import { brands, serviceExtras } from '@/components/approved/family-content';

const Arrow = () => <ArrowUpRight size={18} aria-hidden="true" />;

function keepTail(label: string) {
  const words = label.trim().split(/\s+/);
  if (words.length < 3) return label;
  return (
    <>
      {words.slice(0, -2).join(' ')}{' '}
      <span className="mobile-keep">{words.slice(-2).join(' ')}</span>
    </>
  );
}

const CARD_ALT: Record<string, string> = {
  'inspection-repairs': 'Open tool bag ready beside a front door',
  'drywall-repair': 'A patched and sanded drywall repair ready for paint',
  'carpentry-trim-repair': 'Interior door trim being fitted and nailed in place',
  'painting-touch-ups': 'A freshly painted interior wall with crisp trim lines',
  'mounting-assembly': 'New cabinet hardware being fitted to a kitchen door',
  'home-maintenance': 'Careful adjustment of an interior door hinge',
};

// Existing approved campaign/planning assets, scoped to the homepage cards.
// These illustrate service scope, never completed company-project evidence.
const CARD_IMAGES: Record<string, {src: string; alt: string; width: number; height: number; position?: string}> = {
  'drywall-repair': {src: '/images/handyman/punch-list-markers.webp', alt: 'Repair-planning notes and blue wall markers beside a window', width: 1216, height: 896},
  'carpentry-trim-repair': {src: '/family/drive/square-2-entry-bench-and-coat-hooks.webp', alt: 'Entry bench, beadboard wall and coat hooks', width: 1200, height: 1200, position: '50% 0%'},
  'painting-touch-ups': {src: '/images/handyman/front-door-repaint-p5-reviewed-20260910.webp', alt: 'Painted front door and surrounding trim', width: 1461, height: 1076},
  'mounting-assembly': {src: '/family/drive/square-1-front-door-smart-lock.webp', alt: 'Black front door with deadbolt and lever handle', width: 1200, height: 1200},
};

/**
 * Answer-first homepage block, then the six most common jobs as picture cards
 * and every service as one line of links. Sentences are the published fact
 * sheet and the service list already on the site; nothing here is a new claim.
 * The first paragraph names the main services and every city served; the hero
 * above it stays free of a city list by the family copy rules.
 */
export function HandymanServicesAnswer() {
  const b = brands.handyman;
  return (
    <section className="f-section f-container [overflow-wrap:anywhere]" id="handyman-services-boise">
      <div className="f-section-top">
        <div className="min-w-0">
          <p className="f-eyebrow">BOISE, IDAHO</p>
          <h2>Handyman services<br /><em>in Boise, Idaho</em></h2>
        </div>
        <div className="min-w-0">
          <p data-speakable="summary">
            Boise Handyman Co handles small home repairs, installs and maintenance in Boise and the Treasure Valley.
            {/* The family relationship, said plainly on the page that owns the
                brand query. A followed link: P5 Home Co is the parent company. */}
            <span className="f-parent-company">
              {' '}A <a href="https://p5homeco.com">P5 Home Co</a> company.
            </span>
          </p>
          <ul className="f-answer-points">
            <li>Drywall repair and paint touch-ups</li>
            <li>Minor plumbing and electrical repairs</li>
            <li>Carpentry and trim</li>
            <li>TV mounting and assembly</li>
            <li>Fence, deck, gutter repair, and caulking</li>
          </ul>
          <p>
            We serve{' '}
            {CITIES.map((city, index) => {
              const joiner = index === CITIES.length - 1 ? '' : index === CITIES.length - 2 ? ' and ' : ', ';
              return (
                <span key={city.slug}>
                  <a href={`/areas/${city.slug}`}>{city.name}</a>
                  {joiner}
                </span>
              );
            })}
            .
          </p>
        </div>
      </div>

      <div className="fr-cards">
        {b.services.map((s, i) => (
          <a className="fr-card" key={s.slug} href={s.live || `/services/${s.slug}`}>
            <span className="fr-card-media">
              <img src={CARD_IMAGES[s.slug]?.src ?? s.image} alt={CARD_IMAGES[s.slug]?.alt ?? CARD_ALT[s.slug] ?? ''} loading={i < 3 ? 'eager' : 'lazy'} width={CARD_IMAGES[s.slug]?.width ?? 1000} height={CARD_IMAGES[s.slug]?.height ?? 750} style={CARD_IMAGES[s.slug]?.position ? {objectPosition: CARD_IMAGES[s.slug].position} : undefined} />
            </span>
            <span className="fr-card-body">
              <h3>{keepTail(s.name)}</h3>
              <p>{s.summary}</p>
              <span className="f-link">Explore this service <Arrow /></span>
            </span>
          </a>
        ))}
      </div>

      <div className="fr-cards-more">
        <span>Also:</span>
        {serviceExtras.handyman.map(([label, href]) => (
          <a className="f-link" key={href} href={href}>{label} <Arrow /></a>
        ))}
      </div>

      <h3 className="fr-every-title">Small jobs, one repair list.</h3>
      <p className="ed-body mt-4 max-w-[65ch]">
        Bring the repairs, installs and maintenance on your list together. We review the tasks, materials and access before agreeing the scope, price and visit plan. Larger construction or structural work needs a different contractor.
      </p>
      <nav className="fr-cities" aria-label="All handyman services">
        {SERVICES.map((service) => (
          <a key={service.slug} href={`/services/${service.slug}`}>{serviceCityAnchor(service.slug, service.name, 'Boise')}</a>
        ))}
        <a href="/services/home-repairs">Home repairs in Boise</a>
        <a href="/re-10-repairs-boise">RE-10 inspection repairs in Boise</a>
      </nav>

      <p className="f-answer-links [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center">
        <a href="/contact">Send your repair list and photos</a>
        <a href="/re-10-repairs-boise">Inspection-related repairs</a>
        <a href="/services/drywall-repair/boise">Drywall repair in Boise</a>
        <a href="/areas/boise">Handyman help in Boise</a>
        <a href="#how-we-build">See how it works</a>
      </p>
    </section>
  );
}
