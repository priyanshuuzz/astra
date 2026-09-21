## 2025-09-21 - React Native Pressable Links and Form Accessibility
**Learning:** Using `<Text onPress>` for action links lacks button role semantics, keyboard focusability, screen reader feedback, and touch feedback.
**Action:** Wrap interactive links in `<Pressable accessibilityRole="button" accessibilityLabel="...">` with `minHeight: 44` and pressed state opacity feedback, and add `accessibilityRole="alert"` to dynamic error text in forms.
