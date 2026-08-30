// ============================================================
// index.js — Main Express server entry point
// ============================================================

const express = require("express");
const fs = require("fs");
const path = require("path");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3000;

// Local "database" file that stores contact form submissions
const MESSAGES_FILE = path.join(__dirname, "messages.json");

// ------------------------------------------------------------
// Rate limiting for contact form
// ------------------------------------------------------------
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // max 10 requests per hour
  message: { error: "Too many messages sent. Please try again later." }
});

// ------------------------------------------------------------
// Middleware
// ------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function readMessages() {
  try {
    const raw = fs.readFileSync(MESSAGES_FILE, "utf-8");
    return raw.trim() ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

function writeMessages(messages) {
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

// ------------------------------------------------------------
// Routes
// ------------------------------------------------------------

// POST /api/contact
app.post("/api/contact", contactLimiter, (req, res) => {
  const { name, email, message } = req.body || {};

  // Validate
  if (!name || !email || !message || !message.trim()) {
    return res.status(400).json({
      error: "Name, email, and a non-empty message are required.",
    });
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      error: "Please provide a valid email address.",
    });
  }

  const messages = readMessages();

  // Remove any existing message with same email (prevent duplicates)
  const filteredMessages = messages.filter(m => m.email !== email);
  
  filteredMessages.push({
    id: Date.now(),
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    receivedAt: new Date().toISOString(),
  });

  writeMessages(filteredMessages);

  res.status(201).json({ 
    success: true, 
    message: "Message received. Thank you!" 
  });
});

// GET /api/messages
app.get("/api/messages", (req, res) => {
  res.json(readMessages());
});

// Health check
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
  console.log(`Messages stored at: ${MESSAGES_FILE}`);
});