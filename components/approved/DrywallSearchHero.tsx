import { FamilyButton } from '@/components/family/Button';
import { ConsultCTA } from '@/components/modals/ConsultCTA';
import { SITE_CONFIG } from '@/shared/siteConfig';
import { CTA_PRIMARY } from '@/shared/ctaCopy';
import styles from './FocusedSearchHero.module.css';
import { ReviewedPageBarClearance } from './ReviewedPageBarClearance';

interface Breadcrumb { name: string; href?: string }

/** Opted in by exactly the two reviewed drywall URLs. The longer introduction
 * remains visible immediately after the hero, with its original destinations. */
export function DrywallSearchHero({h1, overview, speakableSummary, breadcrumbs, callFirst}: {
  h1: string;
  overview: string;
  speakableSummary: string;
  breadcrumbs: Breadcrumb[];
  callFirst: boolean;
}) {
  return <>
    <ReviewedPageBarClearance />
    <section className={styles.serviceHero} data-focused-search-hero="" aria-labelledby="drywall-search-title">
      <div className={styles.serviceCopy}>
        <p className="sr-only" data-speakable="summary">{speakableSummary}</p>
        <h1 id="drywall-search-title">{h1}</h1>
        <p className={styles.support}>Tell us what needs repair.</p>
        <div className={styles.actions}>
          {callFirst ? <>
            <FamilyButton href={SITE_CONFIG.phoneHref} variant="primary" size="lg" aria-label={`Call ${SITE_CONFIG.name}`} data-hero-cta="primary">Call Us</FamilyButton>
            <FamilyButton href={SITE_CONFIG.phoneSmsHref} variant="secondary" size="lg" aria-label={`Text ${SITE_CONFIG.name}`}>Text Us</FamilyButton>
          </> : <ConsultCTA variant="brand" size="lg" data-testid="button-primary-service-hero" data-hero-cta="primary" trackingLocation="landing_hero">{CTA_PRIMARY}</ConsultCTA>}
        </div>
      </div>
      <div className={styles.serviceMedia}>
        <img src="/images/handyman/punch-list-markers.webp" width={1216} height={896} loading="eager" fetchPriority="high" alt="Repair-planning notes and blue wall markers beside a window" />
      </div>
    </section>
    <section className={styles.details} aria-label="Repair scope and contact details">
      <div className={styles.detailsInner}>
        <nav aria-label="Breadcrumb"><ol className={styles.crumbs}>{breadcrumbs.map((item, index)=><li key={item.name}>
          {item.href ? <a href={item.href}>{item.name}</a> : <span aria-current="page">{item.name}</span>}
          {index < breadcrumbs.length - 1 && <span aria-hidden="true">/</span>}
        </li>)}</ol></nav>
        {callFirst && <p>Have damaged drywall? Call Boise Handyman Co to discuss the repair, or send a description.</p>}
        <p>{overview}</p>
        <div className={styles.contactOptions}>
          {callFirst ? <a href="#service-inquiry" className={styles.contactLink}>Describe the Damage</a> : <a href={SITE_CONFIG.phoneHref} className={styles.contactLink} data-testid="link-call-service-hero">Prefer to talk? Call {SITE_CONFIG.phone}</a>}
          <span>{SITE_CONFIG.phone}</span>
        </div>
        {callFirst ? <p>Prefer another option? Use the form below.</p> : <p>Mon to Fri 9 AM to 6 PM, Sat 9 AM to 4 PM</p>}
      </div>
    </section>
  </>;
}
