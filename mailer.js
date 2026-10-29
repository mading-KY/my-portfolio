// ============================================================
// mailer.js
// Sends an email notification for each contact form submission
// using the Brevo HTTP API.
// Requires BREVO_API_KEY, BREVO_SENDER_EMAIL,
// BREVO_SENDER_NAME, and EMAIL_TO in .env.
// ============================================================

async function sendContactEmail({ name, email, message }) {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY not configured");
  }

  if (!process.env.BREVO_SENDER_EMAIL) {
    throw new Error("BREVO_SENDER_EMAIL not configured");
  }

  if (!process.env.EMAIL_TO) {
    throw new Error("EMAIL_TO not configured");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: process.env.BREVO_SENDER_NAME || "Mading Majok",
        email: process.env.BREVO_SENDER_EMAIL,
      },
      to: [
        {
          email: process.env.EMAIL_TO,
          name: "Mading Majok",
        },
      ],
      replyTo: {
        email,
        name,
      },
      subject: `New portfolio message from ${name}`,
      textContent: `From: ${name} <${email}>\n\n${message}`,
      htmlContent: `
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brevo API error: ${response.status} ${errorText}`);
  }

  return await response.json();
}

module.exports = { sendContactEmail };