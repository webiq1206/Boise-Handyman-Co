"use client";

/** Stable per-inquiry id survives reloads and is shared by quote follow-up. */
export function inquiryId(key = "lead"): string {
  const storageKey = `bh_inquiry_${key}`;
  try {
    const existing = sessionStorage.getItem(storageKey);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(storageKey, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}