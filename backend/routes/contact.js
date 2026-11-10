// POST /api/contact — footer inquiry form and services quote form.
const express = require("express");
const rateLimit = require("express-rate-limit");
const mailer = require("../mailer");
const { isValidEmail } = require("../lib/util");
const { PHONE_LENGTHS, DIAL_TO_CODE } = require("../phone-rules");
const { todayISO, buildQuoteMarkdown } = require("../quote-doc");
const { buildOwnerEmail } = require("../emails/owner-notification");
const { buildClientEmail } = require("../emails/client-confirmation");

const router = express.Router();

router.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please try again later." },
  })
);

function isValidPhone(phone, countryCode) {
  const digits = String(phone || "").replace(/[\s\-\(\)\+]/g, "");
  if (!/^\d+$/.test(digits)) return false;
  const code = DIAL_TO_CODE[countryCode] || null;
  const lengths = code ? PHONE_LENGTHS[code] : null;
  if (lengths && lengths.length) return lengths.indexOf(digits.length) !== -1;
  return /^\d{6,15}$/.test(digits);
}

router.post("/", async function (req, res) {
  const body = req.body || {};
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const countryCode = typeof body.countryCode === "string" ? body.countryCode.trim() : "";
  const message = typeof body.message === "string" ? body.message : "";

  // 1. Honeypot — pretend success for bots
  if (body.website) {
    return res.json({ success: true, confirmationSent: false, message: "Message sent successfully." });
  }

  // 2. Timestamp window: 3s – 30min
  if (body._timestamp) {
    const elapsed = Date.now() - parseInt(body._timestamp, 10);
    if (!(elapsed >= 3000 && elapsed <= 1800000)) {
      return res.status(400).json({ error: "Submission rejected. Please try again." });
    }
  }

  // 3. Validation
  if (!email && !phone) return res.status(400).json({ error: "Email or phone number is required." });
  if (email && !isValidEmail(email)) return res.status(400).json({ error: "Invalid email address." });
  if (phone && !isValidPhone(phone, countryCode)) return res.status(400).json({ error: "Invalid phone number." });
  if (message.trim().length < 10) return res.status(400).json({ error: "Message must be at least 10 characters." });

  const service = typeof body.service === "string" ? body.service.trim().slice(0, 60) : "";
  const quote = body.quote;
  const hasQuote = !!quote && typeof quote === "object" && !Array.isArray(quote) && typeof quote.siteType === "string";

  if (!mailer.isConfigured()) {
    return res.status(503).json({ error: "Contact form is not set up yet. Please email cabscodepro@gmail.com directly." });
  }

  const sub = {
    email: email,
    phone: phone,
    countryCode: countryCode,
    message: message.trim(),
    service: service,
    quote: hasQuote ? quote : null,
  };

  // 4. Owner notification (must succeed)
  try {
    const owner = buildOwnerEmail(sub);
    const ownerMail = {
      fromName: "CabsCode Contact Form",
      to: mailer.NOTIFY_EMAIL,
      replyTo: email || undefined,
      subject: owner.subject,
      text: owner.text,
      html: owner.html,
    };
    if (hasQuote) {
      ownerMail.attachments = [
        { filename: "quote-" + todayISO() + ".md", content: buildQuoteMarkdown(quote, sub), contentType: "text/markdown" },
      ];
    }
    await mailer.sendMail(ownerMail);
  } catch (err) {
    console.error("Owner notification send error:", err);
    return res.status(500).json({ error: "Failed to send message. Please try again later." });
  }

  // 5. Client auto-reply (best effort)
  let confirmationSent = false;
  if (email) {
    try {
      const client = buildClientEmail(sub);
      await mailer.sendMail({ fromName: "CabsCode", to: email, subject: client.subject, text: client.text, html: client.html });
      confirmationSent = true;
    } catch (err) {
      console.error("Client confirmation send error:", err);
    }
  }

  res.json({ success: true, confirmationSent: confirmationSent, message: "Message sent successfully." });
});

module.exports = router;
