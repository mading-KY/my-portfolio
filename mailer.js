// ============================================================
// mailer.js
// Sends an email notification for each contact form submission
// using the Brevo HTTP API.
// Requires BREVO_API_KEY, BREVO_SENDER_EMAIL, EMAIL_TO (and optionally
// BREVO_SENDER_NAME) in .env.
// ============================================================

const escapeHtml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

async function sendContactEmail({ name, email, message }) {
  if (!process.env.BREVO_API_KEY) throw new Error("BREVO_API_KEY not configured");
  if (!process.env.BREVO_SENDER_EMAIL) throw new Error("BREVO_SENDER_EMAIL not configured");
  if (!process.env.EMAIL_TO) throw new Error("EMAIL_TO not configured");

  const safeName = escapeHtml(name);
  const subjectName = String(name).replace(/[\r\n]+/g, " ").slice(0, 80);

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    signal: AbortSignal.timeout(15000),          // never hang forever on the email provider
    body: JSON.stringify({
      sender: { name: process.env.BREVO_SENDER_NAME || "Mading Majok", email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email: process.env.EMAIL_TO, name: "Mading Majok" }],
      replyTo: { email, name: subjectName },
      subject: `New portfolio message from ${subjectName}`,
      textContent: `From: ${subjectName} <${email}>\n\n${message}`,
      // everything visitors type is escaped, so it can't inject HTML or links into your inbox
      htmlContent: `
        <p><strong>From:</strong> ${safeName} (${escapeHtml(email)})</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
      `,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brevo API error: ${response.status} ${errorText}`);
  }
  return await response.json();
}

module.exports = { sendContactEmail, escapeHtml };