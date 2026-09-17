## 2026-09-17 - Replace clickable Text chips with accessible Pressables
**Learning:** Raw `<Text onPress={...}>` components in React Native/Expo lack essential screen reader attributes (`accessibilityRole`, `accessibilityState`) and visual press feedback.
**Action:** Always wrap interactive chip/tag selectors in `<Pressable>` with `accessibilityRole="button"`, `accessibilityState={{ selected: isSelected }}`, and an explicit `accessibilityLabel`.
