import { draftCredentials, readDraft } from "@/lib/p5/store";
import { responseWithEnhancedDecision } from "@/server/services/enhancedConversionSuppression";

/**
 * Contact the enhanced-conversion tag would send. The submit receipt carries
 * the customer on the estimate document. Intake receipts do not, so the saved
 * draft is the fallback. A missing credential leaves the decision allowed.
 */
export async function estimatorLeadContact(request: Request, body: unknown): Promise<{ email?: string | null; phone?: string | null } | null> {
  const customer = body && typeof body === "object"
    ? (body as { document?: { customer?: { email?: string; phone?: string } } }).document?.customer
    : undefined;
  if (customer && (customer.email || customer.phone)) return { email: customer.email, phone: customer.phone };
  try {
    const { id, key } = draftCredentials(request);
    const draft = await readDraft(id, key);
    if (draft?.contact && (draft.contact.email || draft.contact.phone)) return { email: draft.contact.email, phone: draft.contact.phone };
  } catch {
    return null;
  }
  return null;
}

/** Attaches the suppression decision without changing a non-success response. */
export async function decorateEstimatorLead(request: Request, response: Response): Promise<Response> {
  if (response.status !== 200) return response;
  let body: unknown = null;
  try {
    body = await response.clone().json();
  } catch {
    body = null;
  }
  return responseWithEnhancedDecision(response, await estimatorLeadContact(request, body));
}
