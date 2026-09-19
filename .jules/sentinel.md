## 2025-05-20 - Self-Registration Privilege Escalation
**Vulnerability:** The public user registration function (`signUp`) accepted an arbitrary `role` parameter from the client and inserted/stored it directly into Supabase user metadata and `public.profiles`. An attacker could self-grant `admin` or `staff` roles.
**Learning:** Client-facing sign-up APIs must never trust client-supplied role payloads when database RLS policies grant permissions based on profile role columns.
**Prevention:** Hardcode self-registration roles to the least-privileged default (`patient`) in client authentication context handlers and provision elevated roles out-of-band via database administrator scripts.
