## 2025-05-10 - Accessible Selector Chips in React Native / Expo
**Learning:** In React Native / Expo, interactive selector chips built with `<Text onPress>` lack screen reader semantics, accessibility states (e.g. `selected`), and visual touch feedback.
**Action:** Always wrap chip options in `<Pressable accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel="...">` and separate View container styling from Text typography styling.
