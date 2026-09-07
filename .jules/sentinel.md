## 2025-09-07 - Reflective CORS with Credentials Vulnerability

**Vulnerability:**
The CORS middleware blindly reflected any incoming `Origin` header (`Access-Control-Allow-Origin: req.headers.origin`) while sending `Access-Control-Allow-Credentials: true`. This allowed malicious third-party websites to make authenticated cross-origin requests using cookie credentials and access responses.

**Learning:**
Reflecting `req.headers.origin` directly without origin validation is effectively equivalent to `Access-Control-Allow-Origin: *` with credentials enabled, breaking cross-origin browser protection.

**Prevention:**
Always validate incoming request origins against trusted domains/patterns before reflecting the origin header and enabling credentials.
