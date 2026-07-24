require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

app.use("/api/contact", limiter);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function verifyTurnstileToken(token) {
  const params = new URLSearchParams();
  params.append("secret", process.env.TURNSTILE_SECRET_KEY);
  params.append("response", token);

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: params,
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

app.post("/api/contact", async (req, res) => {
  const { email, message, "cf-turnstile-response": turnstileToken, _timestamp } = req.body;

  // 1. Honeypot check — reject silently if filled (bot)
  if (req.body.website) {
    return res.json({ success: true, message: "Message sent successfully." });
  }

  // 2. Timestamp check
  const now = Date.now();
  if (_timestamp) {
    const elapsed = now - parseInt(_timestamp, 10);
    if (elapsed < 3000 || elapsed > 1800000) {
      return res.status(400).json({ error: "Submission rejected. Please try again." });
    }
  }

  // 3. Validate required fields
  if (!email || !message) {
    return res.status(400).json({ error: "Email and message are required." });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email address." });
  }

  if (message.trim().length < 10) {
    return res.status(400).json({ error: "Message must be at least 10 characters." });
  }

  // 4. Turnstile verification
  if (turnstileToken) {
    const valid = await verifyTurnstileToken(turnstileToken);
    if (!valid) {
      return res.status(403).json({ error: "Security check failed. Please try again." });
    }
  } else {
    return res.status(400).json({ error: "Security token missing." });
  }

  // 5. Send email
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message);

  try {
    await transporter.sendMail({
      from: `"CabsCode Contact Form" <${process.env.EMAIL_USER}>`,
      to: process.env.CONTACT_EMAIL,
      replyTo: email,
      subject: `New Project Inquiry from ${email}`,
      text: `From: ${email}\n\n${message}`,
      html: `
        <h2>New Project Inquiry</h2>
        <p><strong>From:</strong> ${safeEmail}</p>
        <hr />
        <p>${safeMessage.replace(/\n/g, "<br />")}</p>
      `,
    });

    res.json({ success: true, message: "Message sent successfully." });
  } catch (err) {
    console.error("Email send error:", err);
    res.status(500).json({ error: "Failed to send message. Please try again later." });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Contact API running on port ${PORT}`);
});
