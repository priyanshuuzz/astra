## 2025-02-23 - Accessibility Labels on React Native Stepper Controls
**Learning:** In React Native / Expo, stepper controls using `Pressable` around simple character symbols (like `+` and `−`) are unannounced or poorly announced by screen readers without explicit accessibility attributes.
**Action:** Always add `accessibilityRole="button"` and clear `accessibilityLabel` attributes (e.g. `accessibilityLabel="Increase ICU beds"`) to icon-only or symbol-only stepper controls.
