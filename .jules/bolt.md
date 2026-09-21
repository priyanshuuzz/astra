## 2025-05-18 - Lazily Cache Normalized Slices in Hospital Recommendation Engine
**Learning:** Re-normalizing specialty and facility strings with regex and lowercasing on every required capability check created unnecessary string allocations and CPU churn during hospital ranking.
**Action:** Lazily build and reuse normalized search strings per hospital instance during multi-capability evaluation loops.
