## 2025-05-18 - Lazy normalization and single-pass fallback checks in hospital ranking
**Learning:** In ASTRA's recommendation engine, hospital capability fallback checking repeated string normalization (regex and array allocations) for every required capability per hospital during ranking.
**Action:** Always lazily compute and normalize hospital metadata (`specialties` + `facilities`) at most once per hospital score computation, and hoist static lookup objects outside hot paths.
