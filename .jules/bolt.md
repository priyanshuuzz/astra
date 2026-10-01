# Bolt's Journal - Performance Learnings

## 2025-05-10 - Memoizing HospitalCard for List Re-render Optimization
**Learning:** React Native lists rendering complex items (like `HospitalCard` with provenance panels, status pills, and metrics) re-render every item when parent state (search inputs, filters, or active emergency banners) changes unless item components are memoized with `React.memo`.
**Action:** Always wrap card and list-item UI components in `React.memo` when rendered inside parent containers or FlatLists with frequent state updates.
