# Bolt's Journal - Critical Performance Learnings

## 2025-05-18 - Hospital Recommendation Engine Caching & Substring Matching
**Learning:** Evaluating hospital scoring and capability gate checks on every ranking pass caused heavy string concatenation, array mapping, and `Date` heap allocations. Using `WeakMap<Hospital, string>` to cache normalized hospital specialty and facility strings per hospital reference cut ranking execution time by ~52.8% (from 4918ms to 2321ms for 100k rank calls).
**Action:** When filtering or scoring large lists of domain entities against static attributes, use `WeakMap` to cache normalized lookup strings or pre-computed keys lazily per object reference, avoid constructing `new Date()` inside tight loops, and pass pre-computed batch values (like timestamps and trigonometry constants).
