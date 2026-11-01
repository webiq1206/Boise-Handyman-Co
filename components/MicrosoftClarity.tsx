import Script from 'next/script';
import { afterFirstInteraction } from '@/lib/deferredThirdParty';

const CLARITY_PROJECT_ID = 'y2aeap6n0p';

/**
 * Microsoft Clarity. The stub (window.clarity, which queues calls) is set up
 * after hydration; the clarity.ms tag is requested only on the first
 * interaction or 5 seconds after load (lib/deferredThirdParty.ts). Form fields
 * are already masked by the beforeInteractive clarity-form-mask script in
 * app/layout.tsx, which runs before this and before the tag can record.
 */
export function MicrosoftClarity() {
  // Production-only: keep dev sessions out of Clarity heatmaps/recordings.
  if (process.env.NODE_ENV !== 'production') return null;
  if (!CLARITY_PROJECT_ID) return null;
  return (
    <Script
      id="clarity-script"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            ${afterFirstInteraction('t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i+"?ref=bwt";y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);')}
        })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");`,
      }}
    />
  );
}
