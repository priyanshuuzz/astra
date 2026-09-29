# Palette UX & Accessibility Journal

## 2025-05-18 - Password Visibility Toggle in React Native Auth Forms
**Learning:** Icon buttons within input fields (e.g., password visibility toggles) require explicit `accessibilityRole="button"`, `accessibilityLabel`, and `accessibilityHint` attributes in React Native to provide necessary context to screen readers, as plain Pressable components without labels are unannounced or unclear.
**Action:** Always wrap input field icon controls in accessible Pressables with contextual labels that update based on state (e.g. "Show password" / "Hide password").
