# Sentinel Security Journal

## 2025-05-18 - CORS Origin Reflection & Cookie Security Misconfigurations
**Vulnerability:** Indiscriminate CORS origin reflection (`Access-Control-Allow-Origin: req.headers.origin`) combined with `Access-Control-Allow-Credentials: true` in `server/_core/index.ts`, and hardcoded `SameSite=None` on insecure non-HTTPS connections in `server/_core/cookies.ts`.
**Learning:** Reflecting untrusted `Origin` headers when `Credentials` are allowed enables malicious 3rd party domains to execute credentialed requests against the server API. Additionally, browsers drop `SameSite=None` cookies if `Secure` is false.
**Prevention:** Validate the `Origin` header against an explicit whitelist or regex pattern before reflecting it with credentials. Set `sameSite` to `"lax"` when the connection is non-HTTPS (`secure: false`).
