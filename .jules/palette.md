## 2026-08-26 - React Native Text Clickables and Screen Reader Accessibility
**Learning:** Using `<Text onPress={...}>` in React Native omits `accessibilityRole="button"`, touch feedback states (`pressed`), and keyboard focus indicators. Replacing text clickables with `<Pressable accessibilityRole="button" ...>` ensures screen readers announce interactive actions and provides immediate visual feedback.
**Action:** Always wrap interactive text actions in a `<Pressable>` with `accessibilityRole="button"`, `accessibilityLabel`, `accessibilityHint`, and active state feedback.
