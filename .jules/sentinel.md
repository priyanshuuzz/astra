## 2025-02-18 - Require Authentication on Logout Endpoint
**Vulnerability:** Unauthenticated users were able to invoke the `auth.logout` tRPC endpoint because it was exposed as a `publicProcedure`.
**Learning:** Sensitive session lifecycle management endpoints (such as `logout`) should be protected to prevent unauthorized invocation or unnecessary session cookie operations.
**Prevention:** Ensure all session-modifying endpoints utilize `protectedProcedure` middleware instead of `publicProcedure`.
