## 2025-09-14 - React Native Accessible Text Triggers
**Learning:** In React Native / React Native Web, using `<Text onPress=...>` creates non-semantic interactive controls that screen readers fail to announce as buttons and lack touch states and focus indicators.
**Action:** Always wrap interactive text actions in a `<Pressable>` with `accessibilityRole="button"`, `accessibilityLabel`, and pressed feedback styling.
