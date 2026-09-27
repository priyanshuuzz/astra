# Bolt's Performance Journal

## 2025-05-18 - Memoizing Normalized Hospital Capabilities
**Learning:** During emergency hospital ranking, `hasCapability` checks multiple required capabilities per facility. Constructing and normalizing (`.map(norm)`) hospital specialties and facilities repeatedly created significant garbage collection and regex overhead.
**Action:** Use a `WeakMap<Hospital, string[]>` to cache pre-normalized haystack strings per hospital reference across multi-capability evaluations.
