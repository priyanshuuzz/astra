## 2025-09-16 - CORS Arbitrary Origin Reflection with Credentials
**Vulnerability:** CORS middleware reflected any `req.headers.origin` while returning `Access-Control-Allow-Credentials: true`.
**Learning:** Reflecting untrusted `Origin` headers with credential support exposes session cookies and user data to cross-origin attacks from malicious sites.
**Prevention:** Always validate `req.headers.origin` against trusted domain patterns (localhost, explicit subdomains, preview URLs) before echoing `Access-Control-Allow-Origin` and setting `Access-Control-Allow-Credentials: true`.
