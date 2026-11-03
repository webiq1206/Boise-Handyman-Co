import { ArrowUpRight } from 'lucide-react';
import { SERVICES } from '@/shared/contentData';
import { toSentenceCase } from '@/shared/sentenceCase';
import { brands, serviceExtras } from '@/components/approved/family-content';

const Arrow = () => <ArrowUpRight size={18} aria-hidden="true" />;

const CARD_ALT: Record<string, string> = {
  'inspection-repairs': 'Open tool bag ready beside a front door',
  'drywall-repair': 'A patched and sanded drywall repair ready for paint',
  'carpentry-trim-repair': 'Interior door trim being fitted and nailed in place',
  'painting-touch-ups': 'A freshly painted interior wall with crisp trim lines',
  'mounting-assembly': 'New cabinet hardware being fitted to a kitchen door',
  'home-maintenance': 'Careful adjustment of an interior door hinge',
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
    <section className="f-section f-container" id="handyman-services-boise">
      <div className="f-section-top">
        <div>
          <p className="f-eyebrow">BOISE, IDAHO</p>
          <h2>Handyman services<br /><em>in Boise, Idaho</em></h2>
        </div>
        <div>
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
          <p>We serve Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton, Garden City and Caldwell.</p>
        </div>
      </div>

      <div className="fr-cards">
        {b.services.map((s, i) => (
          <a className="fr-card" key={s.slug} href={s.live || `/services/${s.slug}`}>
            <span className="fr-card-media">
              <img src={s.image} alt={CARD_ALT[s.slug] ?? ''} loading={i < 3 ? 'eager' : 'lazy'} width="1000" height="750" />
            </span>
            <span className="fr-card-body">
              <h3>{s.name}</h3>
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

      <h3 className="fr-every-title">Every service, one visit.</h3>
      <nav className="fr-cities" aria-label="All handyman services">
        {SERVICES.map((service) => (
          <a key={service.slug} href={`/services/${service.slug}`}>{toSentenceCase(service.name)}</a>
        ))}
        <a href="/re-10-repairs-boise">RE-10 and inspection repairs</a>
      </nav>

      <p className="f-answer-links">
        <a href="/contact">Send your repair list and photos</a>
        <a href="/re-10-repairs-boise">Inspection-related repairs</a>
        <a href="#how-we-build">See how it works</a>
      </p>
    </section>
  );
}
