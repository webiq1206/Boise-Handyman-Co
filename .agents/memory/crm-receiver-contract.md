---
name: CRM receiver contract
description: Verified external lead receiver limits and duplicate behavior that are not visible in this repository.
---

Keep P5 CRM requests below a 90 KiB UTF-8 budget and within the receiver's field limits. Do not assume receiver support for durable idempotency identifiers.

**Why:** The private receiver source uses Express's default 100 KiB JSON limit, strips unknown idempotency fields, and deduplicates only by email for 60 seconds. Its duplicate response is HTTP 409 with `error: "Duplicate submission"` and an existing `leadId`.

**How to apply:** Treat the sender outbox's transactional uniqueness and no-blind-retry behavior as the durable duplicate defense. Only accept the receiver's exact duplicate response shape; keep payload compaction bounded and fail closed if the body cannot fit.