// Notification sent to NOTIFY_EMAIL for every contact / quote submission.
const { escapeHtml } = require("../lib/util");
const { fmt, todayISO, pageDescription, buildClientConfirmation, buildQuoteMarkdown } = require("../quote-doc");
const L = require("./layout");

function waLink(sub) {
  if (!sub.phone) return "";
  const country = String(sub.countryCode || "").replace(/\D/g, "");
  const number = String(sub.phone).replace(/\D/g, "").replace(/^0+/, "");
  return "https://wa.me/" + country + number;
}

function contactLabel(sub) {
  if (sub.email && sub.phone) return sub.email + " / " + (sub.countryCode || "") + " " + sub.phone;
  if (sub.email) return sub.email;
  return (sub.countryCode || "") + " " + sub.phone;
}

// sub: { email, phone, countryCode, message, service, quote }
function buildOwnerEmail(sub) {
  const quote = sub.quote || null;
  const service = sub.service ? String(sub.service) : "";
  const wa = waLink(sub);

  const subject = quote
    ? "New Website Quote Request — " + quote.siteType + " from " + contactLabel(sub)
    : (service ? "[" + service + "] " : "") + "New Project Inquiry from " + contactLabel(sub);

  const rows = [
    ["Date", todayISO()],
    ["Email", sub.email ? '<a href="mailto:' + escapeHtml(sub.email) + '" style="color:' + L.C.green + ';">' + escapeHtml(sub.email) + "</a>" : ""],
    ["Phone / WhatsApp", sub.phone ? escapeHtml((sub.countryCode || "") + " " + sub.phone) : ""],
    ["Service", service ? escapeHtml(service) : ""],
  ];

  let breakdown = "";
  if (quote) {
    const q = [["Site type", escapeHtml(quote.siteType)]];
    if (quote.quoteOnly) q.push(["Pages", "Custom quote"]);
    else q.push(["Pages", escapeHtml(pageDescription(quote)) + " — <strong>P" + fmt(quote.pagePrice) + "</strong>"]);
    (quote.addons || []).forEach(function (a) {
      q.push(["Add-on", escapeHtml(a.label) + " — <strong>P" + fmt(a.price) + "</strong>"]);
    });
    (quote.monthly || []).forEach(function (m) {
      q.push(["Monthly", escapeHtml(m.label) + " — <strong>P" + fmt(m.price) + "/" + escapeHtml(m.per) + "</strong>"]);
    });
    q.push(["One-time total", "<strong>" + (quote.quoteOnly ? "Custom quote" : "P" + fmt(quote.oneTimeTotal)) + "</strong>"]);
    if (quote.monthlyRecurring > 0) q.push(["Recurring", "<strong>P" + fmt(quote.monthlyRecurring) + "/month</strong>"]);
    breakdown =
      L.sectionLabel("Priced breakdown") +
      L.detailTable(q) +
      (quote.notes ? L.sectionLabel("Client notes") + L.quoteBlock(quote.notes) : "") +
      L.paragraph('<span style="font-size:13px;color:' + L.C.muted + ';">A .md copy of this quote is attached.</span>');
  }

  const buttons =
    (sub.email ? L.button("Reply by email", "mailto:" + sub.email) : "") +
    (wa ? L.button("Reply on WhatsApp", wa) : "");

  const body =
    L.badge(quote ? "NEW QUOTE REQUEST" : "NEW INQUIRY") +
    L.heading(quote ? quote.siteType + " quote request" : "New project inquiry") +
    L.sectionLabel("Contact") +
    L.detailTable(rows) +
    breakdown +
    (sub.message ? L.sectionLabel("Message") + L.quoteBlock(sub.message) : "") +
    '<div style="margin-top:8px;">' + buttons + "</div>";

  const textLines = [
    quote ? "NEW QUOTE REQUEST" : "NEW INQUIRY",
    "",
    "From: " + contactLabel(sub),
    service ? "Service: " + service : null,
    wa ? "Reply on WhatsApp: " + wa : null,
    "",
    sub.message || "",
  ];
  if (quote) {
    textLines.push(
      "",
      "===== Client confirmation (forwardable) =====",
      "",
      buildClientConfirmation(quote, sub),
      "",
      "===== Full quote (.md) =====",
      "",
      buildQuoteMarkdown(quote, sub)
    );
  }

  return {
    subject: subject,
    html: L.renderLayout({ preheader: (quote ? "Quote request: " + quote.siteType : "New inquiry") + " from " + contactLabel(sub), body: body }),
    text: textLines.filter(function (l) { return l !== null; }).join("\n"),
  };
}

module.exports = { buildOwnerEmail: buildOwnerEmail };
