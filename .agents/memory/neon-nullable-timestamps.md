---
name: Neon HTTP result normalization
description: Driver-specific handling for nullable timestamps and empty row sets in Neon HTTP queries.
---

Omit unset nullable timestamp fields from Neon HTTP insert objects instead of explicitly assigning `null`.

**Why:** The Neon HTTP path can serialize an explicit null timestamp as an empty string, which PostgreSQL rejects with error 22007. In-process PGlite tests can still pass, so they do not expose this behavior.

The same path can expose an empty row set as `rows: null`, causing the Neon/Drizzle adapter to throw a TypeError while mapping results. Normalize only that exact adapter error to an empty array where zero rows are a valid outcome.

An `UPDATE ... RETURNING` can also apply the mutation while the adapter exposes no returned rows. For a one-owner network boundary, verify success with a unique caller token written atomically by the update; checking the resulting status alone is not concurrency-safe.

**How to apply:** For optional timestamps that have not occurred yet, rely on the omitted column/default path. Assign a `Date` only when the event exists. For queries that legitimately return zero rows, narrowly normalize the known null-row adapter error without swallowing other failures. When an empty mutation result needs a postcondition read, bind it to the caller with an atomic token rather than trusting shared state. Verify important paths against the development Neon database in addition to isolated PGlite tests.