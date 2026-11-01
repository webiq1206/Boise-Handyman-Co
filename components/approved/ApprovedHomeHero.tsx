import { ArrowUpRight, Phone } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { SITE_CONFIG } from '@/shared/siteConfig';
import { brands } from './family-content';

/** Keeps the approved family palette on the server so the hero is not inside a client component. */
export function ApprovedFamilyFrame({ children }: { children: ReactNode }) {
  const accent = brands.handyman.accent;
  return (
    <div className="family-site family-handyman" style={{ '--f-accent': accent } as CSSProperties}>
      {children}
    </div>
  );
}

/**
 * Home hero rendered by the server: the approved HeroSplit variant. The image,
 * headline and one paragraph are the largest things in the first viewport, so
 * they stay out of the client bundle and out of any entrance animation.
 *
 * One paragraph and two actions: the filled primary ("Send your list and
 * photos") and Call as a text link. "See how it works" sits below the hero, in
 * the services answer. From 701px the photo fills the panel height (cover, with
 * the focal point on the technician and headroom above his hair); on phones it
 * runs full bleed behind the copy with a directional scrim. The rules live in
 * app/design-v2-compliance.css under "Phase 3 home hero".
 *
 * The photo loads at high priority from its own <img fetchPriority>, not a
 * react-dom preload(): preloads ride along in prefetched RSC payloads, so any
 * page linking home would otherwise fetch this hero as well.
 */
export function ApprovedHomeHero() {
  const b = brands.handyman;
  return (
    <>
      <section className="f-hero">
        <img
          src={b.hero}
          alt="Careful adjustment of an interior door hinge"
          fetchPriority="high"
          width="1600"
          height="1000"
          decoding="sync"
        />
        <div className="f-hero-shade" />
        <div className="f-hero-copy">
          <p className="f-eyebrow">{b.kicker}</p>
          <h1>
            Boise handyman.
            <br />
            <em>Your list, handled.</em>
          </h1>
          <p className="f-hero-intro">{b.intro}</p>
          <div className="f-actions">
            <a className="f-button" href="/contact" data-cta="primary" data-testid="button-hero-primary">
              {b.action}
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
            <a className="f-link f-hero-call" href={SITE_CONFIG.phoneHref} data-testid="button-call-hero">
              <Phone size={18} aria-hidden="true" />
              Call {SITE_CONFIG.phone}
            </a>
          </div>
        </div>
      </section>
      <div className="f-proof">
        {b.proof.map((p, i) => (
          <div key={p}>
            <span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            <p>{p}</p>
          </div>
        ))}
      </div>
    </>
  );
}
