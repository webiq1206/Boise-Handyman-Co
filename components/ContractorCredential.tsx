export const CONTRACTOR_REGISTRATION = "Idaho Registered Contractor #8381215";
export const DOPL_LOOKUP_HREF = "https://edopl.idaho.gov/OnlineServices/?link=PubSearch";
export const DOPL_LOOKUP_TITLE = "Look up registration 8381215 on Idaho DOPL";
export const DOPL_LOOKUP_LABEL = "Verify with Idaho DOPL: look up registration 8381215, opens in a new tab";

/** The registration number always renders. The DOPL link is separate and stays off funnel pages. */
export function ContractorCredential({
  showVerifyLink = true,
  linkClassName = "underline underline-offset-2",
}: {
  showVerifyLink?: boolean;
  linkClassName?: string;
}) {
  return (
    <span>
      {CONTRACTOR_REGISTRATION}
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
            Verify with Idaho DOPL
          </a>
        </>
      ) : null}
    </span>
  );
}
