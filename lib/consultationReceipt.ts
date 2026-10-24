/** Validate the server's saved-request contract before success UI or conversions. */
export function requireConsultationReceipt(value: unknown): { accepted: true; replayed?: boolean; submissionId?: string } {
  if (!value || typeof value !== "object") throw new Error("We could not confirm that your request was saved. Your details are still here. Please contact our team before starting another request.");
  const receipt = value as Record<string, unknown>;
  if (receipt.accepted !== true) {
    throw new Error("We could not confirm that your request was saved. Your details are still here. Please contact our team before starting another request.");
  }
  return { accepted: true, replayed: receipt.replayed === true,
    submissionId: typeof receipt.submissionId === "string" ? receipt.submissionId : undefined };
}
