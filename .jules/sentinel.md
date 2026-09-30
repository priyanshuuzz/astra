## 2026-09-30 - Client-side Role Privilege Escalation in Public Self-Registration
**Vulnerability:** Public user self-registration (`signUp`) in `lib/auth-context.tsx` allowed client caller to pass arbitrary roles (e.g. `staff` or `admin`) during user creation, leading to unauthorized privilege escalation.
**Learning:** Public registration endpoints must never accept sensitive role parameters directly from untrusted client callers.
**Prevention:** Hardcode or restrict default public self-registration roles to `patient` (or the least privileged role) in client-facing auth code, enforcing administrative role assignments exclusively through controlled backend workflows.
