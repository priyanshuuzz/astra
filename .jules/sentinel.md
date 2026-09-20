## 2026-03-29 - Client-Side Privilege Escalation in Public Self-Registration
**Vulnerability:** Public user self-registration (`signUp` in `lib/auth-context.tsx`) accepted a caller-specified `role` parameter ('patient', 'staff', 'admin') and directly assigned it to user metadata and profiles table.
**Learning:** Client-side registration handlers must never accept client-supplied role assignments without server-side validation or strict restriction.
**Prevention:** Hardcode public self-registration roles strictly to `'patient'` in client-facing auth wrappers and rely on server/RBAC policies for role escalation.
