# Sentinel Security Journal

## 2025-05-18 - Client-Side Role Assignment in Public Self-Registration
**Vulnerability:** `signUp` in `lib/auth-context.tsx` allowed client-supplied `role` parameter ("admin" / "staff"), enabling privilege escalation on registration.
**Learning:** Public self-registration endpoints/contexts must hardcode default unprivileged roles ('patient') regardless of client parameters, as client data can be manipulated.
**Prevention:** Always restrict privilege level assignment server-side or at the entry auth layer when handling public self-registration.
