// ============================================================
// db/database.js
// SQLite database integration using better-sqlite3
// ============================================================

const path = require("path");
const Database = require("better-sqlite3");

const db = new Database(path.join(__dirname, "..", "portfolio.db"));
db.pragma("journal_mode = WAL");

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    bio TEXT NOT NULL,
    photo TEXT DEFAULT '/mading.jpg',
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    received_at TEXT NOT NULL
  );
`);

// Check if photo column exists in existing table (fix for older databases)
const profileColumns = db.prepare("PRAGMA table_info(profile)").all();
const hasPhotoColumn = profileColumns.some(col => col.name === "photo");

if (!hasPhotoColumn) {
  // Add photo column to existing table
  db.exec("ALTER TABLE profile ADD COLUMN photo TEXT DEFAULT '/mading.jpg'");
  console.log("✅ Added photo column to existing profile table");
}

// Seed default profile on first run
const existingProfile = db.prepare("SELECT id FROM profile WHERE id = 1").get();
if (!existingProfile) {
  db.prepare(
    "INSERT INTO profile (id, name, role, bio, photo, updated_at) VALUES (1, ?, ?, ?, ?, ?)"
  ).run(
    "Mading Majok",
    "Software Engineering Student — Backend Developer & Systems Designer",
    "I build backend applications, databases, and network-driven systems. Currently building JunubMart, a Django marketplace designed for South Sudan.",
    "/mading.jpg",
    new Date().toISOString()
  );
}

module.exports = db;