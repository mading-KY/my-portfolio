// ============================================================
// db/messages.js
// Insert/list/delete contact form submissions from SQLite
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

function deleteMessage(id) {
  const result = db
    .prepare("DELETE FROM messages WHERE id = ?")
    .run(id);

  return result.changes > 0;
}

module.exports = {
  addMessage,
  getMessages,
  deleteMessage,
};