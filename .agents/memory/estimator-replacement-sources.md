---
name: Estimator replacement sources
description: Rules for preserving file history without leaking prior project documents into replacement scope.
---

Stored estimator uploads are historical evidence, not automatically the active source set for every later project generation. A confirmed project replacement atomically starts a new active set, ordinary uploads append to that set, and retries must reuse the same set.

**Why:** Clearing old answers alone still allowed old documents to rebuild a replacement project. A first fix then lost replacement documents on retry or ignored files added later. The active source identity must survive interrupted background analysis independently of local file bytes.

**How to apply:** Treat replacement as a confirmed generation transition. Persist pending source identities before clearing cached files, preserve them across retries, append ordinary additions, and never delete stored customer files merely to deactivate them.