## 2025-05-18 - Client-Side Privilege Escalation in Self-Registration
**Vulnerability:** Public user registration allowed passing arbitrary roles (such as 'admin' or 'staff') through user metadata, which was subsequently stored in profile records without server/context validation.
**Learning:** Client-facing auth helper functions must explicitly overwrite or ignore unauthenticated inputs requesting elevated permissions.
**Prevention:** Always hardcode default untrusted roles ('patient' or 'user') in public signup flows, handling role promotion strictly through backend/admin mechanisms.
