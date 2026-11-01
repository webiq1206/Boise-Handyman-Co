import { ContractorCredential } from "@/components/ContractorCredential";
import { SiteFooter } from "@/components/family/SiteFooter";
import { P5_SOCIAL } from "@/shared/gbpProfile";

/**
 * Boise Handyman Co footer: the shared family SiteFooter, set up by
 * lib/familyBrand.ts. Everything this site's footer carried is there: every
 * service, the pillar guides, the guides and downloads hubs, the blog, about,
 * why choose us, how we work, RE-10 repairs and contact, every service area,
 * the phone, text and email, Save our contact, the public NAP line
 * (PUBLIC_NAP_LINE) with hours, the DBA disclosure, the legal links and P5 Home
 * Co's Facebook page (labelled for the parent, never this brand), plus the P5
 * Home Co family row.
 *
 * Two lines ride the brand column (SiteFooter brandExtra) because the shared
 * config has no slot for them:
 * - P5 Home Co's Google Business Profile, the owner's one Google profile,
 *   labelled for the parent like the Facebook link (owner decision A,
 *   1 November 2026; tests/social-profiles.test.ts).
 * - The registration line, this site's ContractorCredential rather than the
 *   shared one-link line, so the number stays outside the DOPL link
 *   (tests/p5-contractor-registration.test.ts).
 */
export function Footer() {
  return (
    <SiteFooter
      hideRegistration
      brandExtra={
        <>
          <p className="fam-footer-social">
            <a href={P5_SOCIAL.google} rel="noopener" target="_blank" data-testid="link-footer-google">
              {"P5 Home Co on Google"}
            </a>
          </p>
          <p className="fam-footer-credential">
            <ContractorCredential linkClassName="fam-footer-credential-link" />
          </p>
        </>
      }
    />
  );
}
