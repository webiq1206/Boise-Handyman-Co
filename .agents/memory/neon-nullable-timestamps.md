---
name: Neon nullable timestamps
description: Driver-specific handling for unset timestamp fields in Neon HTTP inserts.
---

Omit unset nullable timestamp fields from Neon HTTP insert objects instead of explicitly assigning `null`.

**Why:** The Neon HTTP path can serialize an explicit null timestamp as an empty string, which PostgreSQL rejects with error 22007. In-process PGlite tests can still pass, so they do not expose this behavior.

**How to apply:** For optional timestamps that have not occurred yet, rely on the omitted column/default path. Assign a `Date` only when the event exists, and verify important writes against the development Neon database in addition to isolated PGlite tests.