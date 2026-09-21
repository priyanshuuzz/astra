## 2026-09-21 - Restrict Public Self-Registration Role Assignment
**Vulnerability:** Public user self-registration (`signUp`) in `lib/auth-context.tsx` accepted a client-provided `role` parameter (`"patient" | "staff" | "admin"`), enabling client-side privilege escalation.
**Learning:** Auth context methods exposed to the UI layer should not trust client-supplied role arguments during public self-registration.
**Prevention:** Strictly hardcode assigned roles to `'patient'` inside public self-registration handlers and validate role assignments with backend policies.
