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
 * The existing approved, people-free door/trim photograph runs full bleed under
 * the homepage's uniform black scrim. It avoids the technician head/copy
 * collision in short-phone and enlarged-text crops. This representative image
 * is not a claim of a named completed company project. Eyebrow, H1, terracotta,
 * support and existing action destinations stay unchanged. The proof strip
 * carries the three facts the hero already published, nothing new.
 *
 * Server-rendered: HeroPhoto gives the photo fetchPriority="high" on its own
 * img (no react-dom preload()), so the image and H1 are in the first HTML.
 */
export function ApprovedHomeHero({heroClassName}: {heroClassName?: string} = {}) {
  const b = brands.handyman;
  return (
    <>
      {/* Existing approved WebP, served as is. A /_next/image request
          for a hero can stall and hold the page's load event open, as it did on Boise Remodeling Co. */}
      <div className={[heroClassName, 'pt-0'].filter(Boolean).join(' ')}><HeroPhoto
        image={{
          src: '/images/handyman/front-door-repaint-p5-reviewed-20260910.webp',
          width: 1461,
          height: 1076,
          position: '50% 50%',
          unoptimized: true,
          alt: 'Sage-green front door with white trim and black hardware',
        }}
        eyebrow={b.kicker}
        title="Boise handyman."
        titleAccent="Your list, handled."
        support="Skilled local help for the list that keeps growing."
        primary={{ label: FAMILY_BRAND.cta.label, href: FAMILY_BRAND.cta.href }}
        link={{ label: `Call ${FAMILY_BRAND.phone.display}`, href: FAMILY_BRAND.phone.telHref }}
      /></div>
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
