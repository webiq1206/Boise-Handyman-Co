import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { preload } from 'react-dom';
import type { CSSProperties, ReactNode } from 'react';
import { handymanServiceSentence } from '@/shared/siteConfig';
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
 * Home hero rendered by the server. The image, headline, and answer sentence
 * are the largest things in the first viewport, so they stay out of the
 * client bundle and out of any entrance animation.
 */
export function ApprovedHomeHero() {
  const b = brands.handyman;
  preload(b.hero, { as: 'image', fetchPriority: 'high' });
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
          <p className="f-hero-summary" data-speakable="summary">{handymanServiceSentence()}</p>
          <p>{b.intro}</p>
          <div className="f-actions">
            <a className="f-button" href="/estimate">
              {b.action}
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
            <a className="f-link" href="/contact">
              Send photos or contact us
              <ArrowRight size={18} />
            </a>
          </div>
          <span className="estimator-promise">
            Describe your project. Our team will review it and prepare your estimate.
          </span>
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
