// ============================================================
// contactGuard.js — validates contact-form input and makes sure
// the SAME message is only ever accepted once.
//   • each form submission carries a submissionId (retries reuse it)
//   • identical name + email + message within WINDOW_MS is ignored
// A different message always goes through.
// ============================================================
const crypto = require("crypto");

const LIMITS = { name: 100, email: 254, message: 2000 };
const WINDOW_MS = 60 * 60 * 1000;          // identical content is ignored for 1 hour
const MAX_ENTRIES = 5000;
const seen = new Map();                     // key -> time first accepted

// strip control characters (keep tab / new line) and trim
const clean = (v) =>
  typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim() : "";

function validateContact(body) {
  const b = body && typeof body === "object" ? body : {};
  const name = clean(b.name).replace(/\s+/g, " ");
  const email = clean(b.email).toLowerCase();
  const message = clean(b.message);

  if (!name || !email || !message) return { ok: false, error: "Name, email, and a non-empty message are required." };
  if (name.length > LIMITS.name || email.length > LIMITS.email || message.length > LIMITS.message)
    return { ok: false, error: "One of the fields is too long." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Please enter a valid email address." };

  const id = typeof b.submissionId === "string" && /^[A-Za-z0-9-]{8,64}$/.test(b.submissionId) ? b.submissionId : null;
  return { ok: true, data: { name, email, message, submissionId: id, honeypot: clean(b.website) !== "" } };
}

function keysFor({ name, email, message, submissionId }) {
  const norm = [name.toLowerCase(), email, message.replace(/\s+/g, " ").toLowerCase()].join("\u0000");
  const keys = ["hash:" + crypto.createHash("sha256").update(norm).digest("hex")];
  if (submissionId) keys.push("id:" + submissionId);
  return keys;
}

function sweep(now) {
  for (const [k, t] of seen) if (now - t > WINDOW_MS) seen.delete(k);
  while (seen.size > MAX_ENTRIES) seen.delete(seen.keys().next().value);
}

// Returns "new" (first time, now claimed) or "duplicate". Synchronous, so two
// simultaneous identical requests can never both be "new".
function claimContact(data, now = Date.now()) {
  sweep(now);
  const keys = keysFor(data);
  if (keys.some((k) => seen.has(k))) return "duplicate";
  keys.forEach((k) => seen.set(k, now));
  return "new";
}

// call if saving failed, so the visitor can retry the same message
function releaseContact(data) { keysFor(data).forEach((k) => seen.delete(k)); }

module.exports = { validateContact, claimContact, releaseContact, LIMITS };