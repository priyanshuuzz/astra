## 2025-09-10 - Path Traversal in Storage Proxy Wildcard Routes
**Vulnerability:** Wildcard route parameters (`req.params[0]`) in Express `/manus-storage/*` were directly passed to storage presign API without path traversal sanitization, allowing potential path traversal sequences (`..`, `..\\`, `%2e%2e`).
**Learning:** Wildcard parameters capture arbitrary relative path sequences from the URL request. Passing them directly to file systems or storage presign endpoints without validation creates path traversal risks.
**Prevention:** Always validate and normalize key/file paths from request parameters before passing to downstream storage APIs. Disallow `..` path segments, leading slashes, backslashes, and unparseable URL encodings.
