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

/**
 * Loads GA4 with strategy="lazyOnload" so the ~150KB gtag payload stays off the
 * mobile critical path (a Speed Index / LCP win on throttled connections) while
 * still defining window.gtag before any user interaction. Conversion events fire
 * from lib/analytics.ts on click, which always happens after idle, so nothing is
 * lost; lib/analytics guards on gtag existing anyway.
 */
export function GoogleAnalytics() {
  // Only load analytics in production so local/dev traffic never pollutes the
  // real GA property (and dev network stays quiet for tooling/screenshots).
  if (process.env.NODE_ENV !== 'production') return null;
  if (!GA_MEASUREMENT_ID) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="lazyOnload"
      />
      <Script id="ga-init" strategy="lazyOnload">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
      </Script>
    </>
  );
}
