# Palette Journal - UX & Accessibility Learnings

## 2026-09-26 - Interactive Text Elements in React Native / Expo
**Learning:** Raw `<Text onPress=...>` components in React Native lack semantic screen reader roles (`accessibilityRole="button"`) and tactile press state feedback (such as opacity shift) by default, making form toggle links feel non-interactive and difficult to identify for screen readers.
**Action:** Always wrap interactive text actions in a `<Pressable accessibilityRole="button">` with visual press states (`pressed && styles.pressed`) and clear `accessibilityLabel` properties.
