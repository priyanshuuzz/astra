## 2025-03-03 - Accessible Pressable Text Links in React Native Web
**Learning:** Using raw `<Text onPress=...>` without `accessibilityRole="button"` or a `<Pressable>` container makes interactive links invisible to screen readers and prevents visual active/focus feedback.
**Action:** Always wrap interactive text actions in `<Pressable accessibilityRole="button">` with explicit `accessibilityLabel` and active press state styling (`pressed && { opacity: 0.75 }`).
