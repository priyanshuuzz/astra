## 2025-05-18 - Client-Side Privilege Escalation in User Registration
**Vulnerability:** Public user self-registration (`signUp`) in `lib/auth-context.tsx` permitted client callers to supply `role` parameters (`"admin"`, `"staff"`), resulting in user metadata and profile rows created with elevated privileges.
**Learning:** Client parameters must never be trusted to dictate privileged authorization roles during public account creation.
**Prevention:** Strictly hardcode or enforce public registration assigned roles (e.g. `"patient"`) in server or auth handlers, ignoring user-supplied role parameters.
