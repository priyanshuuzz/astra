## 2025-05-15 - Client-Side Privilege Escalation in Public Self-Registration
**Vulnerability:** Public user self-registration accepted role parameter from the client input and persisted it directly to auth metadata and profile records.
**Learning:** Client-side self-registration interfaces must never trust user-supplied role parameters to assign elevated privileges (e.g. 'staff', 'admin').
**Prevention:** Hardcode or restrict assigned roles on public self-registration endpoints to the least-privileged role ('patient') and handle privilege escalation server-side or via administrative workflows.
