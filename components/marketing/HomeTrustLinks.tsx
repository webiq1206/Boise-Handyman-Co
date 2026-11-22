/**
 * Held BBB profile link from #189. Not mounted while BBB is on hold.
 * Profile link only. No rating, grade, or accreditation claim.
 */
export const BBB_PROFILE_HREF =
  'https://www.bbb.org/us/id/meridian/profile/general-contractor/p5-home-co-llc-1296-1000203624';

export function HomeTrustLinks() {
  return (
    <section className="visit-trust" aria-label="Company profiles">
      <div className="fam-container">
        <ul>
          <li>
            <a href={BBB_PROFILE_HREF} target="_blank" rel="noopener noreferrer">
              Better Business Bureau profile for P5 Home Co
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}
