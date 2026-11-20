export const CONTRACTOR_REGISTRATION = "Idaho Registered Contractor #8381215";
export const DOPL_LOOKUP_HREF = "https://edopl.idaho.gov/OnlineServices/?link=PubSearch";
export const DOPL_LOOKUP_TITLE = "Verify Idaho contractor registration 8381215";
/**
 * The accessible name starts with the link's visible words, "Verify
 * registration" (SEO audit HM-T9: Lighthouse label-content-name-mismatch).
 */
export const DOPL_LOOKUP_LABEL = "Verify registration: Idaho contractor registration 8381215, opens in a new tab";

/**
 * The registration holder, named before the number where a registration line
 * belongs in the footer (owner, 20 November 2026; SEO audit XS-05): the same
 * line on every family site, from the owner's signed proposals.
 */
export const REGISTRATION_HOLDER = "P5 Home Co LLC";

/** The registration number always renders. The DOPL link is separate and stays off funnel pages. */
export function ContractorCredential({
  showVerifyLink = true,
  linkClassName = "underline underline-offset-2",
  showHolder = false,
}: {
  showVerifyLink?: boolean;
  linkClassName?: string;
  /** Prefix the registration holder: "P5 Home Co LLC, Idaho Registered Contractor #8381215". */
  showHolder?: boolean;
}) {
  return (
    <span>
      {/* One text node, so the line reads whole in the HTML. */}
      {showHolder ? `${REGISTRATION_HOLDER}, ${CONTRACTOR_REGISTRATION}` : CONTRACTOR_REGISTRATION}
      {showVerifyLink ? (
        <>
          {" · "}
          <a
            href={DOPL_LOOKUP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            title={DOPL_LOOKUP_TITLE}
            aria-label={DOPL_LOOKUP_LABEL}
            className={linkClassName}
          >
            Verify registration
          </a>
        </>
      ) : null}
    </span>
  );
}
