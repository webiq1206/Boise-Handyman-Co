/** Forward only already-supplied campaign tokens. No browser reads or new collection. */
const KEYS = ['gclid','gbraid','wbraid','utm_source','utm_medium','utm_campaign','utm_term','utm_content'] as const;
export function consultationAttribution(raw: Record<string, unknown> | undefined, email?: string | null): Record<string,string> {
  if (email?.trim().toLowerCase().endsWith('@example.invalid')) return {};
  const out: Record<string,string> = {};
  for (const prefix of ['', 'first_']) for (const key of KEYS) {
    const value = raw?.[prefix + key];
    if (typeof value === 'string' && /^[A-Za-z0-9._~:-]{1,300}$/.test(value)) out[prefix + key] = value;
  }
  // Synthetic campaign evidence must never become a paid customer attribution.
  if ([out.utm_campaign,out.first_utm_campaign].some(v => /^(qa|synthetic)(?:[-_:].*)?$/i.test(v || ''))) return {};
  return out;
}
export function consultationSource(a: Record<string,string>): 'Paid Search'|'Social Media'|'Organic Website'|'Other' {
  // First-touch evidence stays separate; it never overwrites a current touch.
  const prefix = KEYS.some(k => a[k]) ? '' : 'first_';
  const medium = (a[prefix+'utm_medium'] || '').toLowerCase();
  if (a[prefix+'gclid'] || a[prefix+'gbraid'] || a[prefix+'wbraid'] || ['cpc','ppc','paidsearch','paid_search'].includes(medium)) return 'Paid Search';
  if (['social','paid_social','organic_social'].includes(medium)) return 'Social Media';
  if (medium === 'organic') return 'Organic Website';
  return 'Other';
}
