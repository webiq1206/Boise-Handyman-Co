import { googleTagBootstrap } from '@/lib/analyticsBootstrap';
import Script from 'next/script';

// Measurement IDs that belong to a DIFFERENT P5 property and must never be
// used here. G-NGE449QF9Y is Boise Remodeling Co's property - it was the
// hardcoded fallback on this site (a leftover from when boisehandyman.co was
// duplicated from boiseremodeling.co), so every Handyman session, event and
// conversion was landing in the Remodeling company's reports.
//
// boisehandyman.co's own property is 549906676, measurement ID G-4WQQ639LR1.
// A measurement ID is public (it ships in the page source), so it is the
// literal fallback here, as on the sibling sites: a redeploy without
// NEXT_PUBLIC_GA_MEASUREMENT_ID used to render no tag at all and silently drop
// every session. An env value naming the wrong property still falls back to
// this site's own ID rather than sending data elsewhere. The hostname,
// webdriver and opt-out gates live in googleTagBootstrap and are unchanged.
const WRONG_PROPERTY_IDS = new Set(['G-NGE449QF9Y']);
const HANDYMAN_MEASUREMENT_ID = 'G-4WQQ639LR1';

const configuredId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
const GA_MEASUREMENT_ID =
  configuredId && !WRONG_PROPERTY_IDS.has(configuredId) ? configuredId : HANDYMAN_MEASUREMENT_ID;

/** Load only for real visitors on this brand's live hostname. */
export function GoogleAnalytics() {
  if (process.env.NODE_ENV !== 'production' || !GA_MEASUREMENT_ID) return null;
  return (
    <Script id="ga-init" strategy="lazyOnload">
      {googleTagBootstrap({
        hostname: 'boisehandyman.co',
        measurementId: GA_MEASUREMENT_ID,
        adsId: 'AW-18354188204',
        phoneConversionLabel: 'YHR0CIaPz_ccEKzf-q9E',
        phoneNumber: '(208) 477-1169',
      })}
    </Script>
  );
}
