// Auto-reply sent to the client after they submit the contact or quote form.
// Quote variant lists the options and totals only — never per-option prices.
const { escapeHtml } = require("../lib/util");
const { fmt, pageCountText, buildClientConfirmation } = require("../quote-doc");
const L = require("./layout");

// sub: { email, phone, countryCode, message, service, quote }
function buildClientEmail(sub) {
  const quote = sub.quote || null;
  return quote ? quoteEmail(sub, quote) : inquiryEmail(sub);
}

function closing() {
  return (
    L.paragraph("I'll review it and get back to you within <strong>1&ndash;2 business days</strong>. Questions in the meantime? Just reply to this email.") +
    L.paragraph("&mdash; Tema, CabsCode") +
    L.button("Browse our work", L.SITE.studio)
  );
}

function inquiryEmail(sub) {
  const service = sub.service ? String(sub.service) : "";
  const subject = "Thanks — your request has been sent" + (service ? " (" + service + ")" : "");
  const body =
    L.heading("Thanks — your request has been sent") +
    L.paragraph("Hi there, thanks for reaching out to CabsCode. Your message landed safely in my inbox.") +
    (service ? L.sectionLabel("Service") + L.paragraph(escapeHtml(service)) : "") +
    L.sectionLabel("Your message") +
    L.quoteBlock(sub.message || "") +
    closing();

  const text = [
    "Thanks — your request has been sent",
    "",
    "Hi there, thanks for reaching out to CabsCode. Your message landed safely in my inbox.",
    service ? "\nService: " + service : "",
    "",
    "Your message:",
    sub.message || "",
    "",
    "I'll review it and get back to you within 1-2 business days.",
    "Questions in the meantime? Just reply to this email.",
    "— Tema, CabsCode",
    L.SITE.url,
  ]
    .filter(function (l) { return l !== null; })
    .join("\n");

  return {
    subject: subject,
    html: L.renderLayout({ preheader: "Your message reached CabsCode — expect a reply within 1–2 business days.", body: body }),
    text: text,
  };
}

function quoteEmail(sub, quote) {
  const options = (quote.addons || [])
    .map(function (a) { return escapeHtml(a.label); })
    .concat((quote.monthly || []).map(function (m) { return escapeHtml(m.label) + " (monthly)"; }));

  const rows = [["Site type", escapeHtml(quote.siteType)]];
  if (!quote.quoteOnly) rows.push(["Pages", escapeHtml(pageCountText(quote))]);
  rows.push(["Options", options.length ? options.join("<br />") : "None selected"]);
  rows.push(["One-time estimate", "<strong>" + (quote.quoteOnly ? "Custom quote" : "P" + fmt(quote.oneTimeTotal)) + "</strong>"]);
  if (quote.monthlyRecurring > 0) rows.push(["Recurring", "P" + fmt(quote.monthlyRecurring) + "/month"]);

  const body =
    L.heading("Thanks — your request has been sent") +
    L.paragraph("Hi there, thanks for requesting a website quote from CabsCode. Here's a summary of what you picked:") +
    L.sectionLabel("Your quote summary") +
    L.detailTable(rows) +
    (quote.notes ? L.sectionLabel("Your notes") + L.quoteBlock(quote.notes) : "") +
    L.paragraph('<span style="font-size:13px;color:' + L.C.muted + ';">This is an estimate. Your exact quote will follow once I\'ve reviewed the details.</span>') +
    closing();

  return {
    subject: "Your website quote request — " + quote.siteType + " (CabsCode)",
    html: L.renderLayout({ preheader: "Your " + quote.siteType + " quote request reached CabsCode.", body: body }),
    text: buildClientConfirmation(quote, sub),
  };
}

module.exports = { buildClientEmail: buildClientEmail };
