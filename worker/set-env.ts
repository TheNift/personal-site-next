// Minimal `process.env` shim so vinext's RSC runtime can read a compatibility id.
// This deliberately monkey-patches globals that may not exist yet, so the casts
// below intentionally step outside the ambient `Process` types.
/* eslint-disable @typescript-eslint/no-explicit-any */
if (typeof globalThis.process === "undefined") {
  (globalThis as any).process = {};
}
if (typeof globalThis.process.env === "undefined") {
  (globalThis.process as any).env = {};
}
globalThis.process.env.__VINEXT_RSC_COMPATIBILITY_ID = "personal-site";
/* eslint-enable @typescript-eslint/no-explicit-any */
// console.log("[SERVER WORKER DEBUG] Set process.env.__VINEXT_RSC_COMPATIBILITY_ID to personal-site");
