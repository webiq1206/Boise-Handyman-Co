---
name: Accepted lead conversions
description: Durable rules for counting unique project inquiries across estimate, consultation, RE-10, and assistant flows.
---

Count a lead conversion only when the server reports a newly accepted inquiry after atomically saving both the non-PII acceptance ledger record and the workable lead record. Duplicate responses may show success to the visitor but must not redeliver or emit Ads, GA lead, or Meta Lead events.

**Why:** Browser callbacks, retries, reloads, and quote-to-consultation follow-ups can otherwise count or deliver the same inquiry more than once. A lead-record failure must roll back the ledger so a legitimate retry can succeed.

**How to apply:** Every public or assistant-originated inquiry must carry an idempotency ID, pass spam and rate checks, and use the shared transactional acceptance service. Keep attempt, browsing, phone, and text events distinct from accepted-lead events, and keep PII out of analytics payloads.