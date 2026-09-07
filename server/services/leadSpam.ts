export type SpamClassification = { spam: boolean; reason?: "honeypot" | "url_stuffing" | "repeated_characters" | "test_junk" };

/** Conservative, dependency-free checks intended to leave ordinary project prose alone. */
export function classifyLeadSpam(input: { honeypot?: string; name?: string; message?: string; notes?: string }): SpamClassification {
  if (input.honeypot?.trim()) return { spam: true, reason: "honeypot" };
  const prose = [input.message, input.notes].filter(Boolean).join(" ");
  if ((prose.match(/https?:\/\/|www\./gi) || []).length >= 3) return { spam: true, reason: "url_stuffing" };
  if (/(.)\1{11,}/i.test(prose)) return { spam: true, reason: "repeated_characters" };
  if (/^(test|asdf|qwerty|test test)$/i.test(input.name?.trim() || "")) return { spam: true, reason: "test_junk" };
  return { spam: false };
}