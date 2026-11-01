// ============================================================
// admin/admin.js
// Powers the admin dashboard: profile editing, photo uploads,
// and contact message management.
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

// ------------------------------------------------------------
// Load profile data
// ------------------------------------------------------------

async function loadProfile() {
  const res = await fetch("/api/profile");
  const profile = await res.json();

  nameInput.value = profile.name;
  roleInput.value = profile.role;
  bioInput.value = profile.bio;

  if (profile.photo) {
    photoPreview.src = profile.photo;
  }
}

// ------------------------------------------------------------
// Save profile changes
// ------------------------------------------------------------

profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  profileStatus.textContent = "Saving…";

  try {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: nameInput.value.trim(),
        role: roleInput.value.trim(),
        bio: bioInput.value.trim(),
      }),
    });

    if (!res.ok) {
      throw new Error(
        (await res.json()).error || "Save failed."
      );
    }

    profileStatus.textContent = "Saved ✓";
  } catch (err) {
    profileStatus.textContent = "Error: " + err.message;
  }

  setTimeout(() => {
    profileStatus.textContent = "";
  }, 3000);
});

// ------------------------------------------------------------
// Handle photo upload
// ------------------------------------------------------------

photoUpload.addEventListener("change", async (e) => {
  const file = e.target.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    photoStatus.textContent =
      "Please select an image file.";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    photoStatus.textContent =
      "Image must be less than 5MB.";
    return;
  }

  const formData = new FormData();
  formData.append("photo", file);

  photoStatus.textContent = "Uploading…";

  try {
    const res = await fetch("/api/profile/photo", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(
        (await res.json()).error || "Upload failed."
      );
    }

    const data = await res.json();

    photoPreview.src =
      data.photoUrl + "?t=" + Date.now();

    photoStatus.textContent = "Photo uploaded ✓";
  } catch (err) {
    photoStatus.textContent =
      "Error: " + err.message;
  }

  setTimeout(() => {
    photoStatus.textContent = "";
  }, 3000);
});

// ------------------------------------------------------------
// Load messages
// ------------------------------------------------------------

async function loadMessages() {
  try {
    const res = await fetch("/api/messages");

    if (!res.ok) {
      throw new Error("Could not load messages.");
    }

    const messages = await res.json();

    if (!messages.length) {
      messagesTable.hidden = true;
      messagesEmpty.hidden = false;
      messagesEmpty.textContent = "No messages yet.";
      return;
    }

    messagesEmpty.hidden = true;
    messagesTable.hidden = false;

    messagesBody.innerHTML = messages
      .map(
        (m) => `
          <tr id="message-${m.id}">
            <td>${new Date(
              m.received_at || m.receivedAt
            ).toLocaleString()}</td>

            <td>${escapeHtml(m.name)}</td>

            <td>${escapeHtml(m.email)}</td>

            <td>${escapeHtml(m.message)}</td>

            <td>
              <button
                type="button"
                class="btn btn--delete"
                data-message-id="${m.id}"
              >
                Delete
              </button>
            </td>
          </tr>
        `
      )
      .join("");
  } catch (err) {
    messagesTable.hidden = true;
    messagesEmpty.hidden = false;
    messagesEmpty.textContent =
      "Error: " + err.message;
  }
}

// ------------------------------------------------------------
// Delete a message
// ------------------------------------------------------------

async function deleteMessage(id) {
  const confirmed = confirm(
    "Are you sure you want to delete this message?"
  );

  if (!confirmed) return;

  try {
    const res = await fetch(`/api/messages/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error || "Could not delete message."
      );
    }

    const row = document.getElementById(
      `message-${id}`
    );

    if (row) {
      row.remove();
    }

    // If that was the last message, show the empty state.
    if (!messagesBody.children.length) {
      messagesTable.hidden = true;
      messagesEmpty.hidden = false;
      messagesEmpty.textContent = "No messages yet.";
    }
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
}

// ------------------------------------------------------------
// Message table events
// ------------------------------------------------------------

messagesBody.addEventListener("click", (e) => {
  const button = e.target.closest(
    "[data-message-id]"
  );

  if (!button) return;

  const id = Number(
    button.dataset.messageId
  );

  if (!Number.isInteger(id) || id <= 0) return;

  deleteMessage(id);
});

// ------------------------------------------------------------
// Escape HTML before inserting message content
// ------------------------------------------------------------

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ------------------------------------------------------------
// Initialize
// ------------------------------------------------------------

loadProfile();
loadMessages();