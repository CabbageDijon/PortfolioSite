// Gmail SMTP transport for all outgoing mail.
// Env: GMAIL_USER, GMAIL_APP_PASSWORD (16-char app password), NOTIFY_EMAIL.
const nodemailer = require("nodemailer");

const GMAIL_USER = (process.env.GMAIL_USER || "").trim();
const GMAIL_APP_PASSWORD = (process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");
const NOTIFY_EMAIL = (process.env.NOTIFY_EMAIL || "").trim() || GMAIL_USER;

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

function missingVars() {
  const missing = [];
  if (!GMAIL_USER) missing.push("GMAIL_USER");
  if (!GMAIL_APP_PASSWORD) missing.push("GMAIL_APP_PASSWORD");
  return missing;
}

function isConfigured() {
  return missingVars().length === 0;
}

// opts: { to, subject, text, html, replyTo, attachments, fromName }
function sendMail(opts) {
  if (!isConfigured()) {
    return Promise.reject(new Error("Mailer not configured: missing " + missingVars().join(", ")));
  }
  const fromName = String(opts.fromName || "CabsCode").replace(/"/g, "");
  const mail = Object.assign({}, opts, {
    from: '"' + fromName + '" <' + GMAIL_USER + ">",
  });
  delete mail.fromName;
  return transporter.sendMail(mail);
}

function verifyOnBoot() {
  const missing = missingVars();
  if (missing.length) {
    console.error(
      "MAIL NOT CONFIGURED: missing " +
        missing.join(", ") +
        ". Set them in the environment (Dokploy -> Environment -> api, or backend/.env locally). " +
        "Contact form submissions will return 503 until then."
    );
    return Promise.resolve(false);
  }
  return transporter
    .verify()
    .then(function () {
      console.log("Gmail SMTP verified (" + GMAIL_USER + " via smtp.gmail.com:587). Notifications -> " + NOTIFY_EMAIL);
      return true;
    })
    .catch(function (err) {
      console.error("Gmail SMTP verification failed:", err && err.message ? err.message : err);
      return false;
    });
}

module.exports = {
  sendMail: sendMail,
  isConfigured: isConfigured,
  verifyOnBoot: verifyOnBoot,
  NOTIFY_EMAIL: NOTIFY_EMAIL,
};
