// ============================================================
// mailer.js
// Sends an email notification for each contact form submission
// using Gmail SMTP. Requires EMAIL_USER and EMAIL_PASS in .env.
// EMAIL_PASS must be a 16-char Gmail App Password.
// ============================================================

const nodemailer = require("nodemailer");

function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER / EMAIL_PASS not configured in .env");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function sendContactEmail({ name, email, message }) {
  const transporter = getTransporter();
  const to = process.env.EMAIL_TO || process.env.EMAIL_USER;

  await transporter.sendMail({
    from: `"Portfolio Contact Form" <${process.env.EMAIL_USER}>`,
    to,
    replyTo: email,
    subject: `New portfolio message from ${name}`,
    text: `From: ${name} <${email}>\n\n${message}`,
    html: `
      <p><strong>From:</strong> ${name} (${email})</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, "<br>")}</p>
    `,
  });
}

module.exports = { sendContactEmail };