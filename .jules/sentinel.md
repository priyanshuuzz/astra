# Sentinel Security Journal

## 2025-05-18 - Client-Side Role Assignment Privilege Escalation
**Vulnerability:** Public user registration (`signUp`) in `lib/auth-context.tsx` allowed the caller to supply any user role parameter (`"patient" | "staff" | "admin"`). Client application or attacker could supply `"admin"` or `"staff"` during registration to gain elevated privileges in Supabase `profiles` table.
**Learning:** Client-side registration options in Auth contexts should never trust client-provided privilege levels or roles.
**Prevention:** Hardcode default unprivileged role (`"patient"`) for public self-registration endpoints, requiring server-side admin APIs or secure database triggers for role elevation.
