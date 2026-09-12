## 2025-05-10 - Express CORS Wildcard Reflection with Credentials
**Vulnerability:** Express CORS middleware dynamically reflected `req.headers.origin` for any request while setting `Access-Control-Allow-Credentials: true`.
**Learning:** Reflecting untrusted `Origin` headers alongside `Access-Control-Allow-Credentials: true` effectively bypasses Same-Origin Policy and permits malicious third-party websites to execute authenticated cross-origin requests.
**Prevention:** Validate requested origins against trusted loopback interfaces, subdomains sharing a verified parent domain, or an explicit whitelist (`isAllowedOrigin`) before reflecting origins or granting credential access.
