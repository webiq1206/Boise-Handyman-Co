import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Navigation } from '@/components/Navigation'
import { ConditionalFooter } from '@/components/ConditionalFooter'
import { Toaster } from '@/components/ui/toaster'
import { Providers } from '@/components/Providers'
import { ScrollToTop } from '@/components/ScrollToTop'
import { SITE_TAGLINE } from '@/shared/siteContent'
import { SITE_CONFIG } from '@/shared/siteConfig'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import { MetaPixel } from '@/components/MetaPixel'
import { MicrosoftClarity } from '@/components/MicrosoftClarity'
import { ConversionTracking } from '@/components/ConversionTracking'
import { AssistantWidget } from '@/components/assistant/AssistantWidget'
import './globals.css'
// The shared P5 family editorial layer. Imported after globals so it can build
// on the site's tokens; identical file in all four brand repositories.
import './family.css'

// P5 family typefaces, self-hosted from the same two OFL variable files P5 Home Co serves.
const manrope = localFont({
  src: '../public/fonts/manrope-variable.woff2',
  weight: '200 800',
  variable: '--font-manrope',
  display: 'swap',
})

// Libre Baskerville Italic is the brand's accent typeface (the italic "Co." in
// the wordmark and "Construction" in the seal). It carries every decorative
// serif moment on the site so type matches the approved marks. Only 400/700 ship.
// Cormorant Garamond carries every serif moment - headings, the italic accent
// word, display numerals, pull quotes - as it does on P5. Wordmark and seal
// artwork keep their original face; marks and live type share a register.
const cormorant = localFont({
  src: '../public/fonts/cormorant-garamond-variable.woff2',
  weight: '300 700',
  variable: '--font-cormorant',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    /*
     * Leads with the primary commercial term ("handyman boise") rather than the
     * brand, mirroring the old title strategy. The regional "Treasure Valley"
     * term is carried by the description and every location page.
     */
    default: `Handyman in Boise, Idaho | ${SITE_CONFIG.name}`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: `Boise handyman for small repairs, installs & home maintenance across Meridian, Eagle, Nampa, Kuna & the Treasure Valley. Drywall, painting, minor plumbing & electrical, carpentry, and mounting, with upfront quotes before we start.`,
  manifest: '/site.webmanifest',
  // Feed discovery for readers, aggregators, and AI/answer-engine crawlers.
  alternates: {
    types: {
      'application/rss+xml': [
        { url: '/feed.xml', title: `${SITE_CONFIG.name} | Home Repair and Maintenance Guides` },
      ],
    },
  },
  authors: [{ name: SITE_CONFIG.name }],
  creator: SITE_CONFIG.name,
  metadataBase: new URL(SITE_CONFIG.siteUrl),
  // Favicon set built from the approved small-size brand icon (ochre field, the
  // script "C" initial), the mark the brand kit specifies for favicons and app
  // icons, since the seal's arc text stops reading below ~160px.
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: SITE_CONFIG.name,
    title: `${SITE_CONFIG.name} | Treasure Valley Handyman`,
    description: `${SITE_TAGLINE}. Small repairs, installs, and home maintenance across the Treasure Valley.`,
    images: [{ url: '/images/og-default.png', width: 1200, height: 630, alt: SITE_CONFIG.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_CONFIG.name} | Treasure Valley Handyman`,
    description: `${SITE_TAGLINE}. Handyman repairs, installs, and maintenance for Boise and the Treasure Valley.`,
    images: ['/images/og-default.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: '#2C302F',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  // Required for env(safe-area-inset-*) to resolve on notched devices, so
  // sticky bottom bars clear the iPhone home indicator.
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`dark ${manrope.variable} ${cormorant.variable}`} style={{ colorScheme: 'dark' }} suppressHydrationWarning>
      <head suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js')`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <noscript>
          <style>{`.reveal-init{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <Providers>
          <ScrollToTop />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-sm focus:bg-foreground focus:px-4 focus:py-2 focus:text-background focus:shadow-lg"
          >
            Skip to content
          </a>
          <div className="flex flex-col min-h-screen">
            <Navigation />
            <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
              {children}
            </main>
            <ConditionalFooter />
          </div>
          <Toaster />
          <AssistantWidget />
        </Providers>
        <GoogleAnalytics />
        <MetaPixel />
        <MicrosoftClarity />
        <ConversionTracking />
      </body>
    </html>
  )
}
