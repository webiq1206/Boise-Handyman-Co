import { P5_SOCIAL } from '@/shared/gbpProfile';

/**
 * Homepage Block 4. The two profile links only, with no score and no review total.
 * Sits above the site footer.
 */
export function HomeTrustLinks() {
  return (
    <section className="visit-trust" aria-label="Company profiles">
      <div className="fam-container">
        <ul>
          <li>
            <a href={P5_SOCIAL.google} target="_blank" rel="noopener noreferrer" data-testid="link-home-google">
              P5 Home Co on Google
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}
