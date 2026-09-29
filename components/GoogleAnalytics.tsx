import { googleTagBootstrap } from '@/lib/analyticsBootstrap';
import Script from 'next/script';

// Measurement IDs that belong to a DIFFERENT P5 property and must never be
// used here. G-NGE449QF9Y is Boise Remodeling Co's property - it was the
// hardcoded fallback on this site (a leftover from when boisehandyman.co was
// duplicated from boiseremodeling.co), so every Handyman session, event and
// conversion was landing in the Remodeling company's reports and inflating
// its numbers. boisehandyman.co's own property is 549906676 (measurement ID
// G-4WQQ639LR1, set in .replit). If NEXT_PUBLIC_GA_MEASUREMENT_ID is ever
// missing or set to the wrong property, this component renders nothing -
// sending no data is correct; sending to the wrong property is not.
const WRONG_PROPERTY_IDS = new Set(['G-NGE449QF9Y']);

const configuredId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
const GA_MEASUREMENT_ID =
  configuredId && !WRONG_PROPERTY_IDS.has(configuredId) ? configuredId : null;

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
