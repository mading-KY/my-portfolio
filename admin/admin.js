// ============================================================
// admin/admin.js
// Powers the admin dashboard: loads the current profile into
// the form, saves edits via PUT /api/profile, handles profile
// photo uploads, and lists every contact submission from GET /api/messages.
// ============================================================

const profileForm = document.getElementById("profileForm");
const nameInput = document.getElementById("p-name");
const roleInput = document.getElementById("p-role");
const bioInput = document.getElementById("p-bio");
const profileStatus = document.getElementById("profileStatus");

const photoPreview = document.getElementById("photoPreview");
const photoUpload = document.getElementById("photoUpload");
const photoStatus = document.getElementById("photoStatus");

const messagesTable = document.getElementById("messagesTable");
const messagesBody = document.getElementById("messagesBody");
const messagesEmpty = document.getElementById("messagesEmpty");

// Load profile data
async function loadProfile() {
  const res = await fetch("/api/profile");
  const profile = await res.json();
  nameInput.value = profile.name;
  roleInput.value = profile.role;
  bioInput.value = profile.bio;
  
  // Update photo preview
  if (profile.photo) {
    photoPreview.src = profile.photo;
  }
}

// Save profile changes
profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  profileStatus.textContent = "Saving…";

  try {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nameInput.value.trim(),
        role: roleInput.value.trim(),
        bio: bioInput.value.trim(),
      }),
    });

    if (!res.ok) throw new Error((await res.json()).error || "Save failed.");
    profileStatus.textContent = "Saved ✓";
  } catch (err) {
    profileStatus.textContent = "Error: " + err.message;
  }
  setTimeout(() => (profileStatus.textContent = ""), 3000);
});

// Handle photo upload
photoUpload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith("image/")) {
    photoStatus.textContent = "Please select an image file.";
    return;
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    photoStatus.textContent = "Image must be less than 5MB.";
    return;
  }

  // Create FormData and upload
  const formData = new FormData();
  formData.append("photo", file);

  photoStatus.textContent = "Uploading…";

  try {
    const res = await fetch("/api/profile/photo", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error((await res.json()).error || "Upload failed.");
    
    const data = await res.json();
    photoPreview.src = data.photoUrl + "?t=" + Date.now(); // Cache bust
    photoStatus.textContent = "Photo uploaded ✓";
  } catch (err) {
    photoStatus.textContent = "Error: " + err.message;
  }

  setTimeout(() => (photoStatus.textContent = ""), 3000);
});

// Load messages
async function loadMessages() {
  const res = await fetch("/api/messages");
  const messages = await res.json();

  if (!messages.length) {
    messagesEmpty.textContent = "No messages yet.";
    return;
  }

  messagesEmpty.hidden = true;
  messagesTable.hidden = false;
  messagesBody.innerHTML = messages
    .map(
      (m) => `
      <tr>
        <td>${new Date(m.received_at || m.receivedAt).toLocaleString()}</td>
        <td>${escapeHtml(m.name)}</td>
        <td>${escapeHtml(m.email)}</td>
        <td>${escapeHtml(m.message)}</td>
      </tr>`
    )
    .join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Initialize
loadProfile();
loadMessages();