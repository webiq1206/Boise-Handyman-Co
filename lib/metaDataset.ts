/** Verified in P5 Co Business Settings on 2026-11-16. Not a business asset URL ID. */
export const HANDYMAN_META_DATASET_ID = "1499692835589602";

/** Fail closed on stale overrides rather than sending Handyman visitors to another brand. */
export function handymanBrowserDataset(configured: string | undefined): string {
  if (configured === undefined) return HANDYMAN_META_DATASET_ID;
  return configured.trim() === HANDYMAN_META_DATASET_ID ? HANDYMAN_META_DATASET_ID : "";
}

/** Keep CAPI opt-in: a token alone must not activate a previously unconfigured route. */
export function handymanServerDataset(serverId: string | undefined, publicId: string | undefined): string {
  const browserId = handymanBrowserDataset(publicId);
  const configured = serverId ?? publicId;
  return browserId && configured?.trim() === browserId ? browserId : "";
}
