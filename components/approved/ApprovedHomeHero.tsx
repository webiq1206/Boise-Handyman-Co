import type { CSSProperties, ReactNode } from 'react';
import { BusinessPhoneLink } from '@/components/BusinessPhoneContact';
import { familyButtonClass } from '@/components/family/Button';
import { brandStyle } from '@/components/family/brandStyle';
import { CONTRACTOR_REGISTRATION } from '@/components/ContractorCredential';
import { FAMILY_BRAND } from '@/lib/familyBrand';
import { HOME_ANSWER } from '@/shared/p5VisibilityCopy';
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
              <p className="fam-hero-answer" data-speakable="summary">{HOME_ANSWER}</p>
              <p className="fam-hero-support">Skilled local help for the list that keeps growing.</p>
              <div className="fam-hero-actions">
                <BusinessPhoneLink
                  className={familyButtonClass({ variant: 'hero', size: 'lg' })}
                  data-hero-cta="primary"
                  data-cta="primary"
                  data-testid="link-hero-call"
                >
                  Call us about your project.
                </BusinessPhoneLink>
                <a href={FAMILY_BRAND.cta.href} className="fam-hero-link" data-cta="secondary">{FAMILY_BRAND.cta.label}</a>
              </div>
            </div>
          </div>
        </section>
      </div>
      {/* Written quote and registration stay. The shared strip hides fewer than three cells, so these two render here. */}
      <section className="fam-proof" aria-label="At a glance" style={brandStyle()}>
        <ul className="fam-container fam-proof-list" data-count={3} style={{ ['--fam-proof-columns' as string]: 2 }}>
          <li className="fam-proof-cell">
            <p className="fam-proof-label">Pricing</p>
            <p className="fam-proof-text">{b.proof[0]}</p>
          </li>
          <li className="fam-proof-cell">
            <p className="fam-proof-label">Registered</p>
            <p className="fam-proof-text">{CONTRACTOR_REGISTRATION}</p>
          </li>
        </ul>
      </section>
    </>
  );
}
