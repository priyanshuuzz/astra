## 2026-08-26 - Restrict Role Assignment on Public Self-Registration
**Vulnerability:** Public user self-registration (`signUp`) in `lib/auth-context.tsx` allowed client callers to specify any role (such as `'admin'` or `'staff'`), which was directly passed to Supabase user metadata and upserted into `profiles`.
**Learning:** Client-side registration parameters can be tampered with by malicious clients, leading to vertical privilege escalation if privileged roles are accepted directly from public API parameters.
**Prevention:** Always hardcode or restrict public self-registration endpoints to the least-privileged role (`'patient'`). Higher-privilege roles (`'staff'`, `'admin'`) must only be assigned via secure backend administrative channels or database triggers.
