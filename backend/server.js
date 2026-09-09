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
  max: 20,
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
  const { email, phone, countryCode, message, _timestamp, service } = req.body;

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
  const rawService =
    typeof service === "string" ? service.trim().slice(0, 60) : "";
  const escService = rawService ? escapeHtml(rawService) : "";
  const serviceTag = rawService ? "[" + rawService + "] " : "";
  const waDigits = isWhatsApp ? String(phone).replace(/\D/g, "") : "";
  const subject =
    serviceTag +
    (isWhatsApp
      ? "New Project Inquiry via WhatsApp from " + (countryCode || "") + " " + phone
      : "New Project Inquiry from " + email);
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
      text:
        "From: " +
        fromLabel +
        (rawService ? "\nService: " + rawService : "") +
        (waDigits ? "\nReply on WhatsApp: https://wa.me/" + waDigits : "") +
        "\n\n" +
        message,
      html: [
        "<h2>New Project Inquiry</h2>",
        "<p><strong>From:</strong> " + fromLabel + "</p>",
        escService ? "<p><strong>Service:</strong> " + escService + "</p>" : "",
        waDigits
          ? '<p><strong>Reply:</strong> <a href="https://wa.me/' +
            waDigits +
            '">WhatsApp chat</a></p>'
          : "",
        "<hr />",
        "<p>" + safeMessage.replace(/\n/g, "<br />") + "</p>",
      ]
        .filter(Boolean)
        .join(""),
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

const seoAudit = require("./seo-audit");

const seoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});
app.use("/api/seo-audit", seoLimiter);

app.post("/api/seo-audit/request-code", async (req, res) => {
  if (req.body.website) return res.json({ success: true, message: "Code sent — check your inbox." });
  if (req.body._timestamp) {
    var elapsed = Date.now() - parseInt(req.body._timestamp, 10);
    if (elapsed < 3000 || elapsed > 1800000) return res.status(400).json({ error: "Submission rejected. Please try again." });
  }
  var email = String(req.body.email || "").trim();
  if (!email || !isValidEmail(email)) return res.status(400).json({ error: "Valid email required." });
  if (!smtpConfigured) return res.status(503).json({ error: "Email not configured. Contact services@cabscode.pro." });
  var code = String(Math.floor(100000 + Math.random() * 900000));
  seoAudit.storeCode(email, code);
  try {
    await transporter.sendMail({
      from: '"CabsCode SEO Audit" <' + process.env.MAIL_FROM + ">",
      to: email,
      subject: "Your SEO Audit code — " + code,
      text: "Your CabsCode SEO Audit verification code is: " + code + "\n\nIt expires in 15 minutes. If you didn't request this, ignore this email.",
      html: "<p>Your <strong>CabsCode SEO Audit</strong> verification code is:</p><p style='font-size:28px;letter-spacing:6px;font-weight:700'>" + code + "</p><p>It expires in 15 minutes.</p>",
    });
  } catch (e) { console.error("audit code send error", e); return res.status(500).json({ error: "Could not send code. Try again." }); }
  res.json({ success: true, message: "Code sent — check your inbox (and spam) for " + email + "." });
});

app.post("/api/seo-audit/terms", async (req, res) => {
  if (req.body.website) return res.json({ success: true, terms: [] });
  if (req.body._timestamp) {
    var elapsed = Date.now() - parseInt(req.body._timestamp, 10);
    if (elapsed < 3000 || elapsed > 1800000) return res.status(400).json({ error: "Submission rejected. Please try again." });
  }
  var businessName = String(req.body.businessName || "").trim();
  var businessType = String(req.body.businessType || "").trim();
  var location = String(req.body.location || "").trim();
  var tier = req.body.tier === "p100" ? "p100" : req.body.tier === "p50" ? "p50" : "free";
  if (!businessName) return res.status(400).json({ error: "Business name required." });
  if (!businessType) return res.status(400).json({ error: "Business type required." });
  if (businessType.toLowerCase() === "other") return res.status(400).json({ error: "Please describe your business type for Other." });
  if (!location) return res.status(400).json({ error: "Location required." });
  var n = tier === "p100" ? 10 : tier === "p50" ? 6 : 3;
  if (!process.env.GEMINI_API_KEY) {
    // Fallback when no Gemini key: deterministic placeholder terms
    var fallback = [businessName, businessType + " " + location, businessType + " near me", "best " + businessType + " " + location, businessType + " prices " + location, businessName + " " + location].slice(0, n);
    return res.json({ terms: fallback, note: "Gemini not configured — placeholder terms." });
  }
  try {
    var prompt = seoAudit.buildTermsPrompt(businessName, businessType, location, tier);
    var data = await seoAudit.geminiGenerate(prompt, tier);
    var terms = Array.isArray(data.terms) ? data.terms : [];
    terms = seoAudit.ensureMandatoryTerms(terms, businessName, businessType, location, n);
    return res.json({ terms: terms });
  } catch (e) {
    console.error("gemini terms error", e);
    return res.status(500).json({ error: "Could not generate terms: " + String(e.message).slice(0, 200) });
  }
});

app.post("/api/seo-audit/run", async (req, res) => {
  if (req.body.website) return res.json({ success: true });
  if (req.body._timestamp) {
    var elapsed = Date.now() - parseInt(req.body._timestamp, 10);
    if (elapsed < 3000 || elapsed > 1800000) return res.status(400).json({ error: "Submission rejected. Please try again." });
  }
  var businessName = String(req.body.businessName || "").trim();
  var businessType = String(req.body.businessType || "").trim();
  var location = String(req.body.location || "").trim();
  var tier = req.body.tier === "p100" ? "p100" : req.body.tier === "p50" ? "p50" : "free";
  var terms = Array.isArray(req.body.terms) ? req.body.terms.map(function (t) { return String(t).trim(); }).filter(Boolean).slice(0, 10) : [];
  var email = String(req.body.email || "").trim();
  var code = String(req.body.code || "").trim();
  var payToken = String(req.body.payToken || "").trim();
  var target = req.body.target === "facebook" ? "facebook" : req.body.target === "website" ? "website" : "name";
  var url = String(req.body.url || "").trim();
  if (!businessName || !businessType || !location) return res.status(400).json({ error: "Business name, type and location required." });
  if (businessType.toLowerCase() === "other") return res.status(400).json({ error: "Please describe your business type for Other." });
  if (!terms.length) return res.status(400).json({ error: "At least one search term required." });
  if (target !== "name" && !url) return res.status(400).json({ error: "URL required for website / Facebook target." });
  if (url) {
    try { var u = new URL(url); if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error(); if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(u.hostname)) return res.status(400).json({ error: "Private URL not allowed." }); } catch (_) { return res.status(400).json({ error: "Invalid URL." }); }
  }
  if (!email || !isValidEmail(email)) return res.status(400).json({ error: "Valid email required for all audits." });

  if (tier === "free") {
    if (!code) return res.status(400).json({ error: "Email code required for free audit. Click Send code." });
    if (!seoAudit.verifyCode(email, code)) return res.status(400).json({ error: "Invalid or expired code." });
    var freeCheck = seoAudit.canFreeRun(email);
    if (!freeCheck.ok) return res.status(429).json({ error: "Free audit limit: 1 per week. Next free " + freeCheck.nextAt.slice(0, 10) + ". Choose P50/P100 for an immediate paid audit." });
  } else {
    if (process.env.PAID_AUDIT_SECRET && !seoAudit.verifyPayToken(payToken, email)) {
      return res.status(402).json({ error: "Paid tier requires a valid unlock token. Request one via the form — pay with Orange Money / MyZaka / card and you’ll receive a token by WhatsApp/email." });
    }
    if (!process.env.PAID_AUDIT_SECRET) {
      // If no secret set, allow paid in dev but warn
      console.warn("PAID_AUDIT_SECRET not set — paid tiers open in dev");
    }
  }

  var tierCaps = { free: { n: 3, pages: 1 }, p50: { n: 6, pages: 3 }, p100: { n: 10, pages: 3 } };
  var cap = tierCaps[tier];
  terms = terms.slice(0, cap.n);
  var pages = cap.pages;

  // Fan-out CSE searches
  var cseResults = [];
  for (var i = 0; i < terms.length; i++) {
    var r = await seoAudit.cseSearch(terms[i], pages);
    if (!r) {
      // Mock when no CSE key
      r = [];
      for (var p = 0; p < pages; p++) r.push({ page: p + 1, items: [{ title: "Mock — " + businessName, link: url || "https://example.com", displayLink: "example.com", rank: p * 10 + 1 }] });
    }
    var flat = [];
    for (var pp = 0; pp < r.length; pp++) {
      var pageItems = r[pp].items || [];
      for (var kk = 0; kk < pageItems.length; kk++) flat.push(pageItems[kk]);
    }
    // For report: we collapse to term-level best match
    var found = null; var rank = null; var pageNo = null;
    for (var rr = 0; rr < r.length; rr++) {
      var its = r[rr].items || [];
      for (var jj = 0; jj < its.length; jj++) {
        var link = (its[jj].link || "").toLowerCase();
        var wants = (url ? (new URL(url).hostname.toLowerCase()) : businessName.toLowerCase());
        if (link.indexOf(wants) !== -1 || link.indexOf(businessName.toLowerCase()) !== -1) { found = its[jj].link; rank = its[jj].rank; pageNo = r[rr].page; break; }
      }
      if (found) break;
    }
    cseResults.push({ term: terms[i], found: found, rank: rank, page: pageNo || 1, pages: r });
  }

  var presence = seoAudit.inferPresence(cseResults, url);
  var onPage = null;
  if (url && target === "website") onPage = await seoAudit.fetchOnPage(url);
  else if (url && target === "facebook") onPage = { url: url, checks: [{ label: "Facebook Page", pass: true, detail: "Social profile — dedicated site recommended" }], passCount: 0, total: 1 };
  else onPage = { url: "", checks: [{ label: "Business name search only", pass: true, detail: "Add website URL for on-page checks" }], passCount: 0, total: 1 };

  var preset = seoAudit.pickPreset(onPage, presence);

  var score = 0;
  if (presence && !presence.isSocialOnly) score += 30;
  if (onPage && onPage.passCount != null) score += Math.round((onPage.passCount / onPage.total) * 30);
  var foundCount = cseResults.filter(function (x) { return x.found; }).length;
  score += Math.round((foundCount / cseResults.length) * 40);
  score = Math.min(100, Math.max(10, score));

  var payload = { businessName: businessName, score: score, verdict: score >= 70 ? "Good — polish and you rank" : score >= 45 ? "Found but weak — fix basics" : "Hard to find — establish presence", presence: presence, results: cseResults, onPage: onPage, preset: preset };

  if (tier !== "free") {
    try {
      var auditPrompt = seoAudit.buildAuditPrompt({ businessName: businessName, businessType: businessType, location: location, tier: tier, terms: terms, url: url }, cseResults, onPage);
      if (auditPrompt) {
        var ai = await seoAudit.geminiGenerate(auditPrompt, tier);
        if (tier === "p50") {
          payload.lowdown = ai.lowdown || ai.verdict || "";
          payload.fixes = ai.fixes || [];
          if (typeof ai.score === "number") payload.score = ai.score;
          if (ai.verdict) payload.verdict = ai.verdict;
        } else {
          payload.recommendation = ai.recommendation || ai.lowdown || "";
          payload.fixes = ai.fixes || [];
          if (typeof ai.score === "number") payload.score = ai.score;
          if (ai.verdict) payload.verdict = ai.verdict;
        }
      }
    } catch (e) {
      console.error("gemini audit error", e);
      // degrade gracefully — still return preset + cse
      payload.aiError = String(e.message).slice(0, 200);
    }
  }

  if (tier === "free") {
    seoAudit.markFreeRun(email);
    seoAudit.clearCode(email);
  }

  // Owner notification — fire-and-forget to cabscode@gmail.com (CONTACT_EMAIL)
  if (smtpConfigured) {
    var ownerSubject = "[SEO Audit " + tier.toUpperCase() + "] " + businessName + " (" + email + ") — " + payload.verdict;
    var ownerText = "New SEO Audit\n\nBusiness: " + businessName + "\nType: " + businessType + "\nLocation: " + location + "\nEmail: " + email + "\nTier: " + tier + "\nTarget: " + target + (url ? " (" + url + ")" : "") + "\nScore: " + payload.score + "/100 — " + payload.verdict + "\nPresence: " + (presence ? presence.label : "") + "\nPreset: " + (preset ? preset.title : "") + "\nTerms: " + terms.join(" | ") + "\n" + (payload.lowdown ? "\nLowdown: " + payload.lowdown : "") + (payload.recommendation ? "\nRecommendation: " + payload.recommendation.slice(0,800) : "") + "\n\nFull JSON:\n" + JSON.stringify(payload,null,2).slice(0,8000);
    transporter.sendMail({
      from: '"CabsCode SEO Audit" <' + process.env.MAIL_FROM + ">",
      to: process.env.CONTACT_EMAIL,
      replyTo: email || undefined,
      subject: ownerSubject,
      text: ownerText,
      html: "<h2>New SEO Audit — " + escapeHtml(tier.toUpperCase()) + "</h2><p><strong>Business:</strong> " + escapeHtml(businessName) + "</p><p><strong>Type:</strong> " + escapeHtml(businessType) + "</p><p><strong>Location:</strong> " + escapeHtml(location) + "</p><p><strong>Email:</strong> " + escapeHtml(email) + "</p><p><strong>Tier:</strong> " + escapeHtml(tier) + "</p><p><strong>Target:</strong> " + escapeHtml(target) + (url ? " (" + escapeHtml(url) + ")" : "") + "</p><p><strong>Score:</strong> " + payload.score + "/100 — " + escapeHtml(payload.verdict) + "</p><p><strong>Presence:</strong> " + escapeHtml(presence ? presence.label : "") + "</p><p><strong>Preset:</strong> " + escapeHtml(preset ? preset.title : "") + "</p><p><strong>Terms:</strong> " + escapeHtml(terms.join(" | ")) + "</p>" + (payload.lowdown ? "<p><strong>Lowdown:</strong> " + escapeHtml(payload.lowdown) + "</p>" : "") + (payload.recommendation ? "<div><strong>Recommendation:</strong><br/>" + escapeHtml(payload.recommendation.slice(0,1000)).replace(/\n/g,"<br/>") + "</div>" : "")
    }).catch(function(e){ console.error("SEO owner mail fail", e); });
  }

  res.json(payload);
});

app.post("/api/seo-audit/mint-token", async (req, res) => {
  const adminToken = process.env.ADMIN_TOKEN || process.env.PAID_AUDIT_SECRET || "";
  const provided = String(req.headers["x-admin-token"] || req.body.adminToken || "").trim();
  if (!adminToken || provided !== adminToken) {
    return res.status(401).json({ error: "Unauthorized. Provide x-admin-token header matching ADMIN_TOKEN (or PAID_AUDIT_SECRET if ADMIN_TOKEN not set)." });
  }
  const email = String(req.body.email || "").trim();
  const tier = String(req.body.tier || "").toLowerCase().trim();
  if (!email || !isValidEmail(email)) return res.status(400).json({ error: "Valid email required." });
  if (tier !== "p50" && tier !== "p100") return res.status(400).json({ error: "tier must be p50 or p100." });
  const crypto = require("crypto");
  const h = crypto.createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
  const sig = crypto.createHmac("sha256", process.env.PAID_AUDIT_SECRET || adminToken).update(tier + ":" + h).digest("hex").slice(0,16);
  const token = `${tier}.${h}.${sig}`;
  if (smtpConfigured) {
    transporter.sendMail({
      from: '"CabsCode SEO Audit" <' + process.env.MAIL_FROM + ">",
      to: process.env.CONTACT_EMAIL,
      subject: "[Token issued " + tier.toUpperCase() + "] " + email,
      text: "Token issued for " + email + " (" + tier + "):\n" + token + "\n\nSend this to customer via WhatsApp/email.",
      html: "<p>Token issued for <strong>" + escapeHtml(email) + "</strong> (" + escapeHtml(tier) + "):</p><p style='font-family:monospace;word-break:break-all;background:#f4f7f5;padding:10px;border-radius:6px'>" + escapeHtml(token) + "</p>"
    }).catch(function(e){ console.error("mint-token owner mail fail", e); });
  }
  res.json({ email, tier, token, note: "Send this token to the customer — they paste it into Paid unlock token." });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Contact API running on port ${PORT}`);
});
