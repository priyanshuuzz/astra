# Bolt's Journal

## 2025-05-18 - Avoid Dynamic String Normalization and Array Allocation in Core Scoring Engine
**Learning:** In the hospital recommendation engine, `hasCapability` was dynamically mapping and normalizing `[...hospital.specialties, ...hospital.facilities]` on every capability check for every hospital during ranking. Pre-normalizing aliases at module initialization, memoizing normalized hospital haystacks using a `WeakMap`, and replacing `.map().some().includes()` array allocations with indexed loops produced a ~3.5x speedup (~71.6% reduction in CPU execution time) for ranking operations.
**Action:** Always memoize object haystack string normalizations with a `WeakMap` and pre-normalize static alias dictionaries outside hot evaluation loops.
