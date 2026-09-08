## 2025-09-08 - Storage Proxy Path Traversal Prevention
**Vulnerability:** The `/manus-storage/*` proxy endpoint forwarded raw path parameters to external presigned URL generators without sanitizing traversal sequences (`..`), backslashes (`\`), or null bytes (`\0`).
**Learning:** Wildcard routes in Express (`/*`) capture arbitrary user input that can be abused for path traversal or arbitrary key fetching if passed unvalidated to backend storage APIs.
**Prevention:** Always validate path parameters in storage proxy routes to ensure they do not contain `..`, `\`, or null bytes before constructing storage request paths.
