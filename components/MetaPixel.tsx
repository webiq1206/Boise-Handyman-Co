import Script from 'next/script';
import { atWindowLoad } from '@/lib/deferredThirdParty';

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '2461987544292871';

/**
 * Meta (Facebook) Pixel. The inline stub runs with strategy="afterInteractive",
 * so window.fbq exists from hydration and PageView (and any Lead fired from
 * lib/analytics.ts via trackMetaEvent) is queued at once. The network script,
 * fbevents.js, is requested promptly at the window load event
 * (lib/deferredThirdParty.ts atWindowLoad), with no wait for interaction and
 * no timeout; it then flushes the queue, so no event is lost.
 *
 * Prompt loading is kept for Landing Page View accuracy on paid traffic: Meta
 * counts this PageView as a Landing Page View and optimizes delivery on it, so
 * a paid visitor who leaves in the first few seconds without touching the page
 * must still register. That matters more than the small blocking-time saving
 * an interaction wait would buy (owner decision, 1 November 2026). Microsoft
 * Clarity, which only records sessions, stays deferred to first interaction.
 *
 * No-op outside production, so local/dev traffic never pollutes the real dataset.
 */
export function MetaPixel() {
  if (process.env.NODE_ENV !== 'production') return null;
  if (!META_PIXEL_ID) return null;
  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
${atWindowLoad('t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s);')}
}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('set','autoConfig',false,'${META_PIXEL_ID}');
fbq('init','${META_PIXEL_ID}');
fbq('track','PageView');`}
    </Script>
  );
}
