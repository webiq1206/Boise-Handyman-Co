import type { CSSProperties, ReactNode } from 'react';
import { HeroPhoto } from '@/components/family/HeroPhoto';
import { ProofStrip } from '@/components/family/ProofStrip';
import { CONTRACTOR_REGISTRATION } from '@/components/ContractorCredential';
import { FAMILY_BRAND } from '@/lib/familyBrand';
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
 * Homepage hero on the shared family HeroPhoto (Phase 2 family chrome).
 *
 * The technician photograph (branded jacket, real tools) runs full bleed with
 * the directional scrim on the open wall to his left; the focal point keeps his
 * complete head in frame from 320px to 1920px. Same eyebrow and H1 as before,
 * two declaratives with the terracotta second line, one support line, one
 * primary ("Send your list and photos" to /contact, where every other primary
 * on the site goes) and Call as the text link. The proof strip under it carries
 * the three facts the hero already published, nothing new.
 *
 * Server-rendered: HeroPhoto gives the photo fetchPriority="high" on its own
 * img (no react-dom preload()), so the image and H1 are in the first HTML.
 */
export function ApprovedHomeHero() {
  const b = brands.handyman;
  return (
    <>
      <HeroPhoto
        image={{
          src: b.hero,
          width: 1280,
          height: 720,
          position: '66% 12%',
          alt: 'Careful adjustment of an interior door hinge',
        }}
        eyebrow={b.kicker}
        title="Boise handyman."
        titleAccent="Your list, handled."
        support="Skilled local help for the list that keeps growing."
        primary={{ label: FAMILY_BRAND.cta.label, href: FAMILY_BRAND.cta.href }}
        link={{ label: `Call ${FAMILY_BRAND.phone.display}`, href: FAMILY_BRAND.phone.telHref }}
      />
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
