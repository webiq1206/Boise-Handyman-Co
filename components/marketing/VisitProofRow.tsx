import { BadgeCheck, FileText, MapPin, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { brandStyle } from '@/components/family/brandStyle';
import {
  DOPL_LOOKUP_HREF,
  DOPL_LOOKUP_TITLE,
} from '@/components/ContractorCredential';
import { SERVICES_HUB_PRICING_ID, VISIT_PROOF, type VisitProofIcon } from '@/shared/servicesHub';

function ProofIcon({ name }: { name: VisitProofIcon }) {
  const props = { size: 16, strokeWidth: 1.75, 'aria-hidden': true as const };
  if (name === 'quote') return <FileText {...props} />;
  if (name === 'trip') return <MapPin {...props} />;
  if (name === 'registered') return <BadgeCheck {...props} />;
  return <ShieldCheck {...props} />;
}

/**
 * Four sourced facts, directly under the homepage hero and again on /services.
 * The registration number stays outside the Verify link. No stars, no review count.
 */
export function VisitProofRow({
  showPricingLink = false,
  as: Tag = 'section',
}: {
  showPricingLink?: boolean;
  /** Use a div when this row sits inside another section. */
  as?: 'section' | 'div';
}) {
  return (
    <Tag className="fam-proof visit-proof" aria-label="At a glance" style={brandStyle()}>
      <ul className={`${Tag === 'section' ? 'fam-container ' : ''}fam-proof-list`} data-count={VISIT_PROOF.length}>
        {VISIT_PROOF.map((item) => (
          <li className="fam-proof-cell" key={item.label}>
            <p className="fam-proof-label">
              <ProofIcon name={item.icon} />
              <span>{item.label}</span>
            </p>
            <p className="fam-proof-text">
              {item.line}
              {item.verify ? (
                <>
                  {' '}
                  <a
                    href={DOPL_LOOKUP_HREF}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={DOPL_LOOKUP_TITLE}
                    aria-label="Verify Idaho contractor registration 8381215, opens in a new tab"
                  >Verify</a>
                </>
              ) : null}
            </p>
          </li>
        ))}
      </ul>
      {showPricingLink ? (
        <p className={`${Tag === 'section' ? 'fam-container ' : ''}visit-proof-more`}>
          <Link href={`/services#${SERVICES_HUB_PRICING_ID}`}>see how a visit is priced</Link>
        </p>
      ) : null}
    </Tag>
  );
}
