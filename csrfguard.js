// ============================================================
// csrfGuard.js — blocks cross-site requests that change data.
// Browsers attach Basic-Auth credentials automatically, so without this a
// page on another website could make a logged-in admin's browser upload a
// photo or delete a message. Normal requests from your own pages pass.
// ============================================================
const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

function sameOriginOnly(req, res, next) {
  if (SAFE.has(req.method)) return next();

  const site = req.get("sec-fetch-site");                       // sent by all modern browsers
  if (site && site !== "same-origin" && site !== "none") return res.status(403).json({ error: "Cross-site request blocked." });

  const origin = req.get("origin");                              // fallback for older browsers
  if (origin) {
    let host = null;
    try { host = new URL(origin).host; } catch { /* invalid Origin header */ }
    if (!host || host !== req.get("host")) return res.status(403).json({ error: "Cross-site request blocked." });
  }
  next();
}

module.exports = { sameOriginOnly };