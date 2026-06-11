if (typeof globalThis.process === "undefined") {
  (globalThis as any).process = {};
}
if (typeof globalThis.process.env === "undefined") {
  (globalThis.process as any).env = {};
}
globalThis.process.env.__VINEXT_RSC_COMPATIBILITY_ID = "personal-site";
// console.log("[SERVER WORKER DEBUG] Set process.env.__VINEXT_RSC_COMPATIBILITY_ID to personal-site");
