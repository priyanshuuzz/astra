# Sentinel Security Journal

## 2026-03-09 - Path Traversal Prevention in Express Route Parameters
**Vulnerability:** Unsanitized catch-all parameter `req.params[0]` in `/manus-storage/*` endpoint passed directly to upstream storage API query params, allowing potential path traversal (`../`).
**Learning:** Catch-all or wildcard parameters in route definitions (e.g., Express `/*`) must be sanitized using `path.normalize` and checked to prevent path traversal attempts.
**Prevention:** Always normalize relative paths and strip or reject leading `/`, `.` or `..` path segments before passing path keys downstream.
