import Script from 'next/script';

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '2461987544292871';

/**
 * Loads the Meta pixel after the window load event. PageView still fires, so
 * landing-page views and later Lead events keep working, but the fbevents
 * payload no longer competes with the hero for bandwidth or the main thread.
 * trackMetaEvent in lib/analytics.ts waits until fbq exists.
 * No-op outside production, so local/dev traffic never pollutes the real dataset.
 */
export function MetaPixel() {
  if (process.env.NODE_ENV !== 'production') return null;
  if (!META_PIXEL_ID) return null;
  return (
    <Script id="meta-pixel" strategy="lazyOnload">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META_PIXEL_ID}');
fbq('track','PageView');`}
    </Script>
  );
}
