import { HOW_P5_WORKS, HOW_P5_WORKS_TITLE } from "@/shared/siteContent";

/**
 * "What you can count on": the six standing promises, said once on the
 * homepage. Since Phase 3 it renders inside the how-it-works column (see
 * ApprovedHowItWorks) instead of as its own band, and it carries the
 * #why-choose-us anchor the footer's "Why choose us" link points at.
 */
export function HowP5Works() {
  return (
    <div id="why-choose-us" className="f-count-on scroll-mt-28">
      <h3 className="f-count-on-title">{HOW_P5_WORKS_TITLE}</h3>
      <ul>
        {HOW_P5_WORKS.map((item) => (
          <li key={item}>
            <span aria-hidden="true">&#10003;</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
