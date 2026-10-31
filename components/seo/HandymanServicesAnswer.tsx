import { SERVICES } from '@/shared/contentData';

/**
 * Answer-first homepage block. Sentences are the published fact sheet and
 * the service list already on the site. Nothing here is a new claim. The
 * first paragraph names the main services and every city served; the hero
 * above it stays free of a city list by the family copy rules.
 */
export function HandymanServicesAnswer() {
  return (
    <section className="f-section f-container" id="handyman-services-boise">
      <p className="f-eyebrow">BOISE, IDAHO</p>
      <h2>Handyman services in Boise, Idaho</h2>
      <p data-speakable="summary">
        Boise Handyman Co handles small home repairs, installs and maintenance in Boise and the Treasure Valley: drywall repair, paint touch-ups, minor plumbing and electrical repairs, carpentry and trim, TV mounting and assembly, fence, deck and gutter repair, and caulking. We serve Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton, Garden City and Caldwell.
        {/* The family relationship, said plainly on the page that owns the
            brand query. A followed link: P5 Home Co is the parent company. */}
        <span className="f-parent-company">
          A <a href="https://p5homeco.com">P5 Home Co</a> company.
        </span>
      </p>
      <p>
        Send the full repair list, clear photos, your Boise-area service address and any date you are working toward. We review the tasks and confirm the scope before scheduling. Work that needs a licensed specialist or a larger remodel is handled separately from a handyman visit.
      </p>
      <h3>What to include in your repair request</h3>
      <ul>
        <li>Each task and where it is in the home</li>
        <li>Photos and any product or material details</li>
        <li>Your requested timing and access considerations</li>
      </ul>
      <p className="f-answer-links">
        <a href="/contact">Send your repair list and photos</a>
        <a href="/re-10-repairs-boise">Inspection-related repairs</a>
        {/* Moved here from the hero in Phase 3: the hero keeps two actions. */}
        <a href="#how-we-build">See how it works</a>
      </p>
      <ul>
        {SERVICES.map((service) => (
          <li key={service.slug}>
            <a href={`/services/${service.slug}`}>{service.name}</a>
          </li>
        ))}
        <li>
          <a href="/re-10-repairs-boise">RE-10 / Inspection Repairs</a>
        </li>
      </ul>
    </section>
  );
}

