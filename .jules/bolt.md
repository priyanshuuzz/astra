# Bolt's Performance Journal

## 2025-05-18 - Hospital Recommendation Engine Loop Optimization

**Learning:** Re-evaluating fallback capability string matching (`[...hospital.specialties, ...hospital.facilities].map(norm)`) inside nested capability requirement checks caused redundant array allocations and string regex normalization operations per capability check for every hospital.

**Action:** Lazily construct normalized search strings once per hospital entity during scoring passes and pass the cached haystack array into fallback capability check helpers. Hoist geometric calculation constants (`DEG_TO_RAD`, `EARTH_DIAMETER_KM`) to module scope to avoid closure allocation overhead in hot scoring loops.
