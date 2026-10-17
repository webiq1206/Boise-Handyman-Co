import { SITE_CONFIG } from "@/shared/siteConfig";

/**
 * The estimator hides the marketing header. This bar is the above-the-fold
 * call and text pair, in the server HTML. The estimator measures a fixed
 * header and sits below it.
 */
export default function EstimateLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="estimate-reach" data-site-header>
        <a href={SITE_CONFIG.phoneHref} data-testid="link-phone-estimate" aria-label={`Call ${SITE_CONFIG.phone}`}>
          Call {SITE_CONFIG.phone}
        </a>
        <a href={SITE_CONFIG.phoneSmsHref} data-testid="link-text-estimate" aria-label={`Text ${SITE_CONFIG.phone}`}>
          Text {SITE_CONFIG.phone}
        </a>
      </header>
      {children}
    </>
  );
}
