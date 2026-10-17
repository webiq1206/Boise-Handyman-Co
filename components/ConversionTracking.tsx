'use client';

import { useEffect } from 'react';
import { bindContactClicks } from '@/lib/contactClicks';

/**
 * Site-wide conversion tracking for call/text/email intent. Uses a single
 * delegated click listener so every tel:/sms:/mailto: link across the site
 * (nav, hero, footer, sticky bar, contact page) fires a GA event without
 * instrumenting each one. Form submits are tracked at the form (generate_lead).
 * The same listener sends the Google Ads call and text click conversions.
 */
export function ConversionTracking() {
  useEffect(() => bindContactClicks(document), []);

  return null;
}
