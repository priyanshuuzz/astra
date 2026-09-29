## 2025-02-17 - Public Self-Registration Privilege Escalation
**Vulnerability:** The public `signUp` method in `lib/auth-context.tsx` allowed callers to pass an arbitrary `role` parameter ('patient' | 'staff' | 'admin'), enabling unauthenticated client-side privilege escalation.
**Learning:** Client-facing auth context methods should never trust client-supplied role parameters for public registration endpoints.
**Prevention:** Hardcode assigned roles to the lowest-privilege default ('patient') in public sign-up methods, requiring administrative elevation via database or backend channels.
