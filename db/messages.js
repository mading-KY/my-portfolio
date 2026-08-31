// ============================================================
// db/messages.js
// Insert/list contact form submissions from SQLite
// ============================================================

const db = require("./database");

function addMessage({ name, email, message }) {
  const receivedAt = new Date().toISOString();
  db.prepare(
    "INSERT INTO messages (name, email, message, received_at) VALUES (?, ?, ?, ?)"
  ).run(name, email, message, receivedAt);
  return { name, email, message, receivedAt };
}

function getMessages() {
  return db.prepare("SELECT * FROM messages ORDER BY id DESC").all();
}

module.exports = { addMessage, getMessages };