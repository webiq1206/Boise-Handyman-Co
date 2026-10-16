import { SERVICES } from '@/shared/contentData';

/**
 * Answer-first homepage block. Sentences are the published fact sheet and
 * the service list already on the site. Nothing here is a new claim.
 */
export function HandymanServicesAnswer() {
  return (
    <section className="f-section f-container" id="handyman-services-boise">
      <p className="f-eyebrow">BOISE, IDAHO</p>
      <h2>Handyman services in Boise, Idaho</h2>
      <p data-speakable="summary">
        Handyman service for Boise, Idaho and the Treasure Valley: small home repairs, installs, and maintenance. Drywall repair, interior and exterior painting, minor plumbing and electrical, carpentry and trim, mounting and assembly, fence, deck and gutter repair, caulking and punch-list work. Serving Boise, Meridian, Eagle, Nampa, Kuna, Star, Middleton, Garden City, Caldwell. Phone (208) 477-1169.
      </p>
      <p>
        Every job is quoted upfront as one written price before any work starts, priced by the time it takes with a one-hour minimum, and most jobs are finished in a single visit. Pricing comes as a written quote first.{" "}
        <a href="#handyman-cost">See how much a handyman costs in Boise and the Treasure Valley</a>
        . Materials are billed at cost as their own line, and bundling several tasks into one visit is the best value. Work that needs a general contractor or a licensed trade, such as full remodels, additions, repipes, or panel work, is out of scope and referred out honestly.
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
