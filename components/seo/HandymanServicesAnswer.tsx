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

