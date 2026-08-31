// ============================================================
// db/profile.js
// Read/update the single profile row
// ============================================================

const db = require("./database");

function getProfile() {
  return db.prepare("SELECT name, role, bio, photo, updated_at FROM profile WHERE id = 1").get();
}

function updateProfile({ name, role, bio }) {
  db.prepare(
    "UPDATE profile SET name = ?, role = ?, bio = ?, updated_at = ? WHERE id = 1"
  ).run(name, role, bio, new Date().toISOString());
  return getProfile();
}

function updatePhoto(photoUrl) {
  db.prepare(
    "UPDATE profile SET photo = ?, updated_at = ? WHERE id = 1"
  ).run(photoUrl, new Date().toISOString());
  return getProfile();
}

module.exports = { getProfile, updateProfile, updatePhoto };