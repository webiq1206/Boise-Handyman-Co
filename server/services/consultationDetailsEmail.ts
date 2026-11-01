import { EMAIL_BRAND, escapeHtml, wrapEmailHtml } from "@/server/services/emailLayout";

/**
 * The short internal follow-up when a visitor adds details or files to a
 * request they already sent ("Details added: {name}"). It names the person,
 * shows only what was added, and links every file.
 */

const LABEL = `padding:8px 12px 8px 0;color:${EMAIL_BRAND.textMuted};font-size:14px;vertical-align:top;white-space:nowrap;`;
const VALUE = `padding:8px 0;color:${EMAIL_BRAND.text};font-size:14px;vertical-align:top;`;

export function buildDetailsAddedSubject(lead: { name: string }): string {
  return `Details added: ${lead.name}`;
}

function valueHtml(label: string, value: string): string {
  if (label !== "Files") return escapeHtml(value).replace(/\n/g, "<br>");
  return value
    .split("\n")
    .map((line) => {
      const at = line.lastIndexOf(": ");
      const name = at > 0 ? line.slice(0, at) : line;
      const url = at > 0 ? line.slice(at + 2) : "";
      return url
        ? `<a href="${escapeHtml(url)}" style="color:${EMAIL_BRAND.accent};">${escapeHtml(name)}</a>`
        : escapeHtml(name);
    })
    .join("<br>");
}

export function buildDetailsAddedEmailHtml(
  lead: { name: string; phone: string; email: string },
  added: { label: string; value: string }[],
): string {
  const rows = added
    .map(({ label, value }) => `<tr><td style="${LABEL}">${escapeHtml(label)}</td><td style="${VALUE}">${valueHtml(label, value)}</td></tr>`)
    .join("");
  return wrapEmailHtml({
    title: "Details added",
    subtitle: lead.name,
    content: `
      <p style="margin:0 0 20px;font-size:15px;color:${EMAIL_BRAND.text};line-height:1.6;">
        ${escapeHtml(lead.name)} added to the request they sent earlier. The lead record and its notes now include this.
      </p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="${LABEL}">Phone</td><td style="${VALUE}">${escapeHtml(lead.phone)}</td></tr>
        ${lead.email ? `<tr><td style="${LABEL}">Email</td><td style="${VALUE}">${escapeHtml(lead.email)}</td></tr>` : ""}
        ${rows}
      </table>`,
  });
}
