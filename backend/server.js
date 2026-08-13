require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
const { PHONE_LENGTHS, DIAL_TO_CODE } = require("./phone-rules");

function isValidPhone(phone, countryCode) {
  const digits = String(phone || "").replace(/[\s\-\(\)\+]/g, "");
  if (!/^\d+$/.test(digits)) return false;

  const code = DIAL_TO_CODE[countryCode] || null;
  const lengths = code ? PHONE_LENGTHS[code] : null;

  if (lengths && lengths.length) {
    return lengths.indexOf(digits.length) !== -1;
  }
  return /^\d{6,15}$/.test(digits);
}

// Global error handlers — log crashes instead of silently dying
process.on("uncaughtException", function (err) {
  console.error("UNCAUGHT EXCEPTION:", err);
});
process.on("unhandledRejection", function (reason) {
  console.error("UNHANDLED REJECTION:", reason);
});

const app = express();
const PORT = process.env.PORT || 3000;

// Trust Nginx reverse proxy headers for rate limiting
app.set("trust proxy", 1);

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

app.post("/api/contact", async (req, res) => {
  const { email, phone, countryCode, message, _timestamp } = req.body;

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
  if (!email && !phone) {
    return res.status(400).json({ error: "Email or phone number is required." });
  }

  if (email && !isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email address." });
  }

  if (phone) {
    if (!isValidPhone(phone, countryCode)) {
      return res.status(400).json({ error: "Invalid phone number." });
    }
  }

  if (!message || message.trim().length < 10) {
    return res.status(400).json({ error: "Message must be at least 10 characters." });
  }

  // 4. Send email
  const safeMessage = escapeHtml(message);
  const isWhatsApp = !!phone;
  const fromLabel = isWhatsApp
    ? "WhatsApp (" + escapeHtml(countryCode || "") + " " + escapeHtml(phone) + ")"
    : escapeHtml(email);
  const subject = isWhatsApp
    ? "New Project Inquiry via WhatsApp from " + (countryCode || "") + " " + phone
    : "New Project Inquiry from " + email;
  const replyTo = email || undefined;

  try {
    await transporter.sendMail({
      from: '"CabsCode Contact Form" <' + process.env.EMAIL_USER + ">",
      to: process.env.CONTACT_EMAIL,
      replyTo: replyTo,
      subject: subject,
      text: "From: " + fromLabel + "\n\n" + message,
      html: [
        "<h2>New Project Inquiry</h2>",
        "<p><strong>From:</strong> " + fromLabel + "</p>",
        "<hr />",
        "<p>" + safeMessage.replace(/\n/g, "<br />") + "</p>",
      ].join(""),
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
