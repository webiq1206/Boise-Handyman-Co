import { FamilyButton } from '@/components/family/Button';
import { brandStyle } from '@/components/family/brandStyle';
import { SITE_CONFIG } from '@/shared/siteConfig';

/**
 * Replaces the homepage planning-range widget. Call and Text use the same
 * tel/sms targets as the header, so the existing contact-click listener
 * records them. No price is shown.
 */
export function FreeQuoteCta() {
  return (
    <div className="family-site family-handyman" style={brandStyle()}>
      <section className="f-section f-container" aria-labelledby="free-quote-heading" data-testid="free-quote-cta">
        <div className="f-section-top">
          <h2 id="free-quote-heading">Get a free quote</h2>
          <p>Call or text us with what you need done and we'll get back to you with a quote.</p>
        </div>
        <div className="fr-cta-strip-actions">
          <FamilyButton
            href={SITE_CONFIG.phoneHref}
            variant="primary"
            size="lg"
            aria-label={`Call ${SITE_CONFIG.name}`}
            data-testid="link-free-quote-call"
          >
            Call
          </FamilyButton>
          <FamilyButton
            href={SITE_CONFIG.phoneSmsHref}
            variant="secondary"
            size="lg"
            aria-label={`Text ${SITE_CONFIG.name}`}
            data-testid="link-free-quote-text"
          >
            Text
          </FamilyButton>
        </div>
      </section>
    </div>
  );
}
