import type { CSSProperties, ReactNode } from 'react';
import { FamilyButton } from '@/components/family/Button';
import { brandStyle } from '@/components/family/brandStyle';
import { ProofStrip } from '@/components/family/ProofStrip';
import { CONTRACTOR_REGISTRATION } from '@/components/ContractorCredential';
import { FAMILY_BRAND } from '@/lib/familyBrand';
import { CTA_ESTIMATE } from '@/shared/ctaCopy';
import { brands } from './family-content';
import { HandymanHeroVideo } from './HandymanHeroVideo';

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
 * Site-owned homepage video hero. The approved people-free media is decorative,
 * representative imagery; it makes no claim of a completed customer project.
 * Poster, heading and actions are in the first server response. Shared family
 * hooks retain the existing header, navigation and mobile-bar behavior.
 */
export function ApprovedHomeHero({heroClassName}: {heroClassName?: string} = {}) {
  const b = brands.handyman;
  return (
    <>
      <div className={[heroClassName, 'pt-0'].filter(Boolean).join(' ')}>
        <section className="fam-hero" data-family-hero="" data-video-hero=""
          data-desktop-from={FAMILY_BRAND.header.desktopFrom} style={brandStyle()}
          aria-labelledby="family-hero-title">
          <HandymanHeroVideo />
          <div className="fam-hero-scrim" aria-hidden="true" />
          <div className="fam-hero-inner">
            <div className="fam-hero-copy">
              <p className="fam-hero-eyebrow">{b.kicker}</p>
              <h1 className="fam-hero-title" id="family-hero-title">
                Boise handyman.{' '}<span className="fam-hero-accent">Your list, handled.</span>
              </h1>
              <p className="fam-hero-support">Skilled local help for the list that keeps growing.</p>
              <div className="fam-hero-actions">
                {/* Owner decision, 13 November 2026: the hero primary opens the instant
                    estimator (FAMILY_BRAND.cta.href is /instant-estimate). The phone link
                    beside it and the request form further down stay as the path to a person. */}
                <FamilyButton href={FAMILY_BRAND.cta.href} variant="hero" size="lg" data-hero-cta="primary" data-cta="primary">
                  {CTA_ESTIMATE}
                </FamilyButton>
                <a href={FAMILY_BRAND.phone.telHref} className="fam-hero-link">Call {FAMILY_BRAND.phone.display}</a>
              </div>
            </div>
          </div>
        </section>
      </div>
      {/* The three facts this hero already published: written quote, no trip fee, registration. */}
      <ProofStrip
        items={[
          { label: 'Pricing', text: b.proof[0] },
          { label: 'Travel', text: b.proof[1] },
          { label: 'Registered', text: CONTRACTOR_REGISTRATION },
        ]}
      />
    </>
  );
}
