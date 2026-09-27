## 2026-08-26 - Accessible Screen Reader Summaries for Emergency Triage Cards
**Learning:** Container components that aggregate critical visual metrics (such as distance, ETA, readiness, and match score on emergency hospital cards) hide essential information from screen reader users when labeled with generic names like "View Hospital".
**Action:** Always construct comprehensive `accessibilityLabel` strings that summarize key status indicators and triage metrics, and provide explicit interaction context via `accessibilityHint`.
