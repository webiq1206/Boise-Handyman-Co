---
name: Logo color intent
description: Scope of the Boise Handyman logo color correction
---

Handyman lockups stay two-tone. "BOISE HANDYMAN" is bone on dark grounds and charcoal on light grounds. The italic "Co." (C, o, and the period) uses the same terracotta as the family "5": `#CB633B`.

**Why:** A solid terracotta wordmark was the bug fixed in #104. After that, phones still showed a cached steel-blue `#8FAEC4` Co. beside an orange 5. Co. has to match the 5, and a rebuild must not put Co. back on the letter fill.

**How to apply:** Keep Co. in its own accent group. `scripts/brand/wordmark-lock.mjs` throws if that group is missing or if its fill is not `#CB633B`. Header image URLs stay cache-busted (`?v=co-accent`) so an old steel-blue SVG is not reused. Do not publish a solid-accent wordmark.
