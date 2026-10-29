// ============================================================
// index.js — Main Express server
// ============================================================

require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const { addMessage, getMessages } = require("./db/messages");
const { getProfile, updateProfile, updatePhoto } = require("./db/profile");
const { sendContactEmail } = require("./mailer");

const app = express();
const PORT = process.env.PORT || 3000;

// Basic Auth middleware
function basicAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", "Basic realm='Admin'");
    return res.status(401).send("Authentication required.");
  }

  const credentials = Buffer.from(authHeader.split(" ")[1], "base64").toString();
  const [username, password] = credentials.split(":");

  if (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {
    return next();
  }

  res.setHeader("WWW-Authenticate", "Basic realm='Admin'");
  res.status(401).send("Invalid credentials.");
}

// Rate limiting
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: "Too many messages sent. Please try again later." },
});

// Multer setup for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."), false);
    }
  },
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ------------------------------------------------------------
// API Routes
// ------------------------------------------------------------

// GET /api/profile
app.get("/api/profile", (req, res) => {
  res.json(getProfile());
});

// PUT /api/profile (protected)
app.put("/api/profile", basicAuth, (req, res) => {
  const { name, role, bio } = req.body || {};

  if (!name || !role || !bio) {
    return res.status(400).json({ error: "Name, role, and bio are required." });
  }

  const profile = updateProfile({ name, role, bio });
  res.json(profile);
});

// POST /api/profile/photo (protected) - Upload profile photo
app.post("/api/profile/photo", basicAuth, upload.single("photo"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No photo uploaded." });
  }

  const photoUrl = `/uploads/${req.file.filename}`;
  const profile = updatePhoto(photoUrl);
  res.json({ success: true, photoUrl, profile });
});

// POST /api/contact
app.post("/api/contact", contactLimiter, async (req, res) => {
  const { name, email, message } = req.body || {};

  if (!name || !email || !message || !message.trim()) {
    return res.status(400).json({
      error: "Name, email, and a non-empty message are required.",
    });
  }

  addMessage({ name, email, message });

 try {
  await sendContactEmail({ name, email, message });
} catch (err) {
  console.error("Email notification failed:", err);
}

  res.status(201).json({ success: true, message: "Message received. Thank you!" });
});

// GET /api/messages (protected)
app.get("/api/messages", basicAuth, (req, res) => {
  res.json(getMessages());
});

// ------------------------------------------------------------
// Admin Dashboard Routes
// ------------------------------------------------------------

app.get("/admin", basicAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "admin.html"));
});

app.get("/admin.js", basicAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "admin.js"));
});

app.get("/admin.css", basicAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "admin.css"));
});

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