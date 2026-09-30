## 2025-09-30 - Search Bar Tap Targets and TextInput Clear Controls
**Learning:** In React Native mobile views, search inputs wrapped inside pressable visual containers can cause confusion if only internal icons (like filter/tune) are interactive while tapping text does nothing, or if `TextInput` lacks a clear button (`close` icon) for rapid query clearing.
**Action:** Wrap search entry cards in `Pressable` with `accessibilityRole="button"` for navigation triggers, and add a quick clear button to active `TextInput` components along with explicit `accessibilityLabel` and `accessibilityHint`.
