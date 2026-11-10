// Send 4 sample emails (owner + client, inquiry + quote) to NOTIFY_EMAIL.
// Usage: npm run test:mail   (needs GMAIL_USER and GMAIL_APP_PASSWORD in backend/.env)
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mailer = require("../mailer");
const { samples } = require("./sample-data");
const { todayISO, buildQuoteMarkdown } = require("../quote-doc");
const { buildOwnerEmail } = require("../emails/owner-notification");
const { buildClientEmail } = require("../emails/client-confirmation");

async function main() {
  if (!mailer.isConfigured()) {
    await mailer.verifyOnBoot();
    process.exit(1);
  }
  const to = mailer.NOTIFY_EMAIL;
  const inquiry = Object.assign({}, samples["inquiry-email"], { email: to });
  const quoteSub = Object.assign({}, samples["quote-email"], { email: to });

  const jobs = [
    ["owner / inquiry", Object.assign({ fromName: "CabsCode Contact Form", replyTo: to }, buildOwnerEmail(inquiry))],
    ["client / inquiry", Object.assign({ fromName: "CabsCode" }, buildClientEmail(inquiry))],
    [
      "owner / quote",
      Object.assign({ fromName: "CabsCode Contact Form", replyTo: to }, buildOwnerEmail(quoteSub), {
        attachments: [{ filename: "quote-" + todayISO() + ".md", content: buildQuoteMarkdown(quoteSub.quote, quoteSub) }],
      }),
    ],
    ["client / quote", Object.assign({ fromName: "CabsCode" }, buildClientEmail(quoteSub))],
  ];

  let failed = 0;
  for (const [label, mail] of jobs) {
    try {
      const info = await mailer.sendMail(Object.assign({ to: to }, mail, { subject: "[TEST] " + mail.subject }));
      console.log("✔ " + label + " → " + to + " (" + info.messageId + ")");
    } catch (err) {
      failed++;
      console.error("✘ " + label + ": " + (err && err.message));
      hint(err);
    }
  }
  process.exit(failed ? 1 : 0);
}

function hint(err) {
  const msg = String((err && (err.code || "")) + " " + (err && err.message) + " " + (err && err.responseCode));
  if (/ETIMEDOUT|ECONNREFUSED|ESOCKET/.test(msg)) {
    console.error("  hint: could not reach smtp.gmail.com:587. Outbound port 587 may be blocked by your host/firewall (some VPS providers block SMTP by default).");
  }
  if (/535|EAUTH|BadCredentials/.test(msg)) {
    console.error("  hint: Gmail rejected the login (535). Use a 16-char App Password from https://myaccount.google.com/apppasswords, not your normal password, and make sure 2-Step Verification is on.");
  }
}

main();
