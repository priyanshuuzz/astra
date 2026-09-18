## 2025-09-18 - Accessibility Attributes for React Native Pressable Filters & Actions
**Learning:** React Native `Pressable` components used as filter tabs or quick-action navigation links require explicit `accessibilityRole="button"`, `accessibilityLabel`, `accessibilityHint`, and `accessibilityState={{ selected }}` to ensure screen readers communicate their interactive role, current state, and exact action clearly.
**Action:** Always add explicit accessibility roles, hints, and selection states to custom button pills and link components in React Native views.
