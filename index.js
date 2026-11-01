// ============================================================
// index.js — Main Express server
// ============================================================

require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const { addMessage, getMessages, deleteMessage } = require("./db/messages");
const { getProfile, updateProfile, updatePhoto } = require("./db/profile");
const { sendContactEmail } = require("./mailer");
const { validateContact, claimContact, releaseContact } = require("./contactGuard");
const { sameOriginOnly } = require("./csrfGuard");

const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");

// Behind a hosting proxy (Render, Railway, Heroku...) set TRUST_PROXY=1
// so rate limits see each visitor's real IP
if (process.env.TRUST_PROXY) {
  app.set("trust proxy", Number(process.env.TRUST_PROXY));
}

// ------------------------------------------------------------
// Security headers
// ------------------------------------------------------------
const siteHeaders = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "https://fonts.googleapis.com"],
      fontSrc: ["https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
});

// Admin may use inline code; other protections stay on
const adminHeaders = helmet({ contentSecurityPolicy: false });

app.use((req, res, next) =>
  (req.path.startsWith("/admin") ? adminHeaders : siteHeaders)(req, res, next)
);

// Block cross-site POST / PUT / DELETE (see csrfGuard.js)
app.use(sameOriginOnly);

// ------------------------------------------------------------
// Admin login (Basic Auth)
// ------------------------------------------------------------
const sha = (v) => crypto.createHash("sha256").update(String(v)).digest();
const safeEqual = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  skipSuccessfulRequests: true,          // only failed attempts count
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many attempts. Try again later.",
});

function basicAuth(req, res, next) {
  const challenge = () => res.setHeader("WWW-Authenticate", 'Basic realm="Admin"');
  const header = req.headers.authorization || "";

  if (!header.startsWith("Basic ") || !process.env.ADMIN_USER || !process.env.ADMIN_PASS) {
    challenge();
    return res.status(401).send("Authentication required.");
  }

  const decoded = Buffer.from(header.slice(6), "base64").toString();
  const i = decoded.indexOf(":");                 // passwords may contain ":"
  const user = decoded.slice(0, i);
  const pass = decoded.slice(i + 1);

  if (i >= 0 && safeEqual(user, process.env.ADMIN_USER) && safeEqual(pass, process.env.ADMIN_PASS)) {
    return next();
  }

  challenge();
  res.status(401).send("Invalid credentials.");
}

const protect = [authLimiter, basicAuth];

// ------------------------------------------------------------
// Contact rate limit
// ------------------------------------------------------------
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many messages sent. Please try again later." },
});

// ------------------------------------------------------------
// Photo uploads: JPEG / PNG / WebP only (never SVG or HTML), random file names
// ------------------------------------------------------------
const uploadDir = path.join(__dirname, "public", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const EXT = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) =>
      cb(null, `profile-${crypto.randomBytes(8).toString("hex")}${EXT[file.mimetype]}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (EXT[file.mimetype]) return cb(null, true);
    const err = new Error("Only JPEG, PNG or WebP images are allowed.");
    err.code = "UPLOAD_REJECTED";
    cb(err);
  },
});

// remove the previous profile photo so old uploads don't pile up
function removeOldPhoto(previousUrl) {
  if (typeof previousUrl !== "string" || !previousUrl.startsWith("/uploads/profile-")) return;
  fs.unlink(path.join(uploadDir, path.basename(previousUrl)), () => {});   // basename blocks path tricks
}

// ------------------------------------------------------------
// Middleware
// ------------------------------------------------------------
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public")));

// ------------------------------------------------------------
// API Routes
// ------------------------------------------------------------
const text = (v, max) =>
  typeof v === "string" && v.trim() && v.trim().length <= max ? v.trim() : null;

// GET /api/profile
app.get("/api/profile", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(getProfile());
});

// PUT /api/profile (protected)
app.put("/api/profile", protect, (req, res) => {
  const body = req.body || {};
  const name = text(body.name, 80);
  const role = text(body.role, 120);
  const bio = text(body.bio, 600);

  if (!name || !role || !bio) {
    return res.status(400).json({
      error: "Name (80), role (120) and bio (600) are required text fields.",
    });
  }

  res.json(updateProfile({ name, role, bio }));
});

// POST /api/profile/photo (protected)
app.post("/api/profile/photo", protect, upload.single("photo"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No photo uploaded." });
  }

  const previous = (getProfile() || {}).photo;
  const photoUrl = `/uploads/${req.file.filename}`;
  const profile = updatePhoto(photoUrl);
  removeOldPhoto(previous);

  res.json({ success: true, photoUrl, profile });
});

// POST /api/contact
// Saves the message, answers the visitor straight away, then sends the email
// in the background. The same message is never accepted twice (contactGuard.js).
app.post("/api/contact", contactLimiter, async (req, res) => {
  const parsed = validateContact(req.body);
  if (!parsed.ok) return res.status(400).json({ error: parsed.error });
  const data = parsed.data;

  if (data.honeypot) {                              // bots fill the hidden field: pretend it worked
    return res.status(201).json({ success: true, message: "Message received. Thank you!" });
  }

  if (claimContact(data) === "duplicate") {
    return res.status(200).json({ success: true, duplicate: true, message: "Message already received. Thank you!" });
  }

  try {
    await addMessage({ name: data.name, email: data.email, message: data.message });
  } catch (err) {
    releaseContact(data);                           // nothing saved, so the visitor may try again
    console.error("Saving message failed:", err);
    return res.status(500).json({ error: "Could not save your message. Please try again." });
  }

  res.status(201).json({ success: true, message: "Message received. Thank you!" });

  sendContactEmail(data).catch((err) => console.error("Email notification failed:", err.message));
});

// GET /api/messages (protected)
app.get("/api/messages", protect, (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(getMessages());
});

// DELETE /api/messages/:id (protected)
app.delete("/api/messages/:id", protect, async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid message ID." });
  }

  try {
    const deleted = await deleteMessage(id);
    if (!deleted) return res.status(404).json({ error: "Message not found." });
    res.json({ success: true, message: "Message deleted successfully." });
  } catch (err) {
    console.error("Deleting message failed:", err);
    res.status(500).json({ error: "Could not delete the message." });
  }
});

// ------------------------------------------------------------
// Admin Dashboard Routes
// ------------------------------------------------------------
app.get("/admin", protect, (req, res) => res.sendFile(path.join(__dirname, "admin", "admin.html")));
app.get("/admin.js", protect, (req, res) => res.sendFile(path.join(__dirname, "admin", "admin.js")));
app.get("/admin.css", protect, (req, res) => res.sendFile(path.join(__dirname, "admin", "admin.css")));

// ------------------------------------------------------------
// Health check
// ------------------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ------------------------------------------------------------
// Error handling
// ------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") return res.status(413).json({ error: "Request too large." });
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON." });
  if (err.code === "UPLOAD_REJECTED" || err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }

  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// ------------------------------------------------------------
// Start server
// ------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Portfolio backend running at http://localhost:${PORT}`);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
});