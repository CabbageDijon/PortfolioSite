require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
const { PHONE_LENGTHS, DIAL_TO_CODE } = require("./phone-rules");
const {
  todayISO,
  buildQuoteMarkdown,
  buildClientConfirmation,
  buildClientConfirmationHtml,
  buildOwnerHtml,
} = require("./quote-doc");

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
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const smtpConfigured = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

if (!smtpConfigured) {
  console.error(
    "SMTP NOT CONFIGURED: set SMTP_HOST, SMTP_USER and SMTP_PASS in the environment " +
      "(Dokploy -> Environment -> api). Contact form submissions will be rejected."
  );
}

transporter.verify(function (err) {
  if (err) {
    console.error("SMTP connection check failed:", err);
  } else {
    console.log("SMTP connection verified (" + process.env.SMTP_HOST + ":" + process.env.SMTP_PORT + ")");
  }
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

  const quote = req.body.quote;
  const hasQuote =
    !!quote &&
    typeof quote === "object" &&
    !Array.isArray(quote) &&
    typeof quote.siteType === "string";
  const contact = { email: email || "", phone: phone || "", countryCode: countryCode || "" };

  if (!smtpConfigured) {
    return res
      .status(503)
      .json({ error: "Contact form is not set up yet. Please email services@cabscode.pro directly." });
  }

  try {
    const ownerMail = {
      from: '"CabsCode Contact Form" <' + process.env.MAIL_FROM + ">",
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
    };

    if (hasQuote) {
      const markdown = buildQuoteMarkdown(quote, contact);
      ownerMail.subject =
        "New Website Quote Request — " +
        quote.siteType +
        (email ? " from " + email : "");
      ownerMail.text =
        "From: " +
        fromLabel +
        "\n\n===== Client confirmation (forwardable) =====\n\n" +
        buildClientConfirmation(quote, contact) +
        "\n\n===== Full quote (.md) =====\n\n" +
        markdown;
      ownerMail.html = buildOwnerHtml(quote, contact);
      ownerMail.attachments = [
        { filename: "quote-" + todayISO() + ".md", content: markdown },
      ];
    }

    await transporter.sendMail(ownerMail);

    // Client confirmation — basic list + final price only, no per-option prices.
    if (hasQuote && email) {
      try {
        await transporter.sendMail({
          from: '"CabsCode" <' + process.env.MAIL_FROM + ">",
          to: email,
          subject: "Your Website Quote — " + quote.siteType + " (CabsCode)",
          text: buildClientConfirmation(quote, contact),
          html: buildClientConfirmationHtml(quote, contact),
        });
      } catch (err) {
        console.error("Client confirmation send error:", err);
      }
    }

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
