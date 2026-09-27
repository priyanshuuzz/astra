# Sentinel Security Journal

## 2026-03-31 - Enforce Role Assignment in Client-Side Registration
**Vulnerability:** Public user self-registration allowed arbitrary role parameter passing (`"admin"` or `"staff"`), enabling client-side privilege escalation.
**Learning:** Client-facing registration functions must never trust user-supplied role inputs or permit callers to assign elevated roles during public sign-up.
**Prevention:** Hardcode self-registration roles strictly to `'patient'` in `signUp` and enforce role checks on server-side RLS/database policies or admin-only provisioning functions.
