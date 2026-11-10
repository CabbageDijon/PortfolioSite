// Render every email template with sample data to emails/preview/*.html.
// Usage: npm run preview:emails
const fs = require("fs");
const path = require("path");
const { samples } = require("./sample-data");
const { buildOwnerEmail } = require("../emails/owner-notification");
const { buildClientEmail } = require("../emails/client-confirmation");

const outDir = path.join(__dirname, "..", "emails", "preview");
fs.mkdirSync(outDir, { recursive: true });

const written = [];
Object.keys(samples).forEach(function (key) {
  const sub = samples[key];
  const owner = buildOwnerEmail(sub);
  write("owner-" + key, owner);
  if (sub.email) write("client-" + key, buildClientEmail(sub));
});

function write(name, mail) {
  const file = path.join(outDir, name + ".html");
  fs.writeFileSync(file, mail.html);
  fs.writeFileSync(path.join(outDir, name + ".txt"), "Subject: " + mail.subject + "\n\n" + mail.text);
  written.push(file);
}

console.log("Wrote " + written.length + " previews:");
written.forEach(function (f) { console.log("  " + path.relative(process.cwd(), f)); });
