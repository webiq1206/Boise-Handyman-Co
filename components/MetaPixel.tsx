import Script from 'next/script';
import { afterFirstInteraction } from '@/lib/deferredThirdParty';

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '2461987544292871';

/**
 * Meta (Facebook) Pixel. The inline stub runs with strategy="afterInteractive",
 * so window.fbq exists from hydration and PageView (and any Lead fired from
 * lib/analytics.ts via trackMetaEvent) is queued at once. The network script,
 * fbevents.js, is requested only on the visitor's first interaction
 * (pointerdown, keydown, scroll, touchstart) or 5 seconds after load
 * (lib/deferredThirdParty.ts); it then flushes the queue, so no event is lost.
 *
 * Trade-off, stated plainly: a visit that leaves within 5 seconds of load
 * without touching the page now sends no PageView, so Meta's Landing Page
 * View count can read lower than before. The site rule is that no third-party
 * script loads before interaction except gtag.
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
${afterFirstInteraction('t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s);')}
}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('set','autoConfig',false,'${META_PIXEL_ID}');
fbq('init','${META_PIXEL_ID}');
fbq('track','PageView');`}
    </Script>
  );
}
