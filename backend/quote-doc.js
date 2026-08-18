function pad(n) {
  return n < 10 ? "0" + n : "" + n;
}

function todayISO() {
  var d = new Date();
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

function fmt(n) {
  return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function escapeHtml(text) {
  return String(text == null ? "" : text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function contactLine(contact) {
  if (contact && contact.email) return contact.email;
  if (contact && contact.phone) return (contact.countryCode || "") + " " + contact.phone;
  return "No contact";
}

function pageDescription(quote) {
  var pages = quote.pages;
  if (quote.extraPages > 0) pages += " + " + quote.extraPages + " extra";
  return quote.siteType + " · " + pages + " page(s)";
}

function pageCountText(quote) {
  var pages = quote.pages;
  if (quote.extraPages > 0) pages += " + " + quote.extraPages + " extra";
  return pages + " page(s)";
}

// Owner-facing, full pricing. Option lines end in " — **Pxxx**" so the
// quote-viewer page can parse them back into a styled option list.
function buildQuoteMarkdown(quote, contact) {
  var L = [];
  L.push("# CabsCode Website Quote");
  L.push("");
  L.push("**Date:** " + todayISO());
  L.push("**Contact:** " + contactLine(contact));
  L.push("");
  L.push("## Site Type");
  L.push("");
  if (quote.quoteOnly) {
    L.push("- " + quote.siteType + " — **Custom quote**");
  } else {
    L.push("- " + pageDescription(quote) + " — **P" + fmt(quote.pagePrice) + "**");
  }
  L.push("");
  L.push("## One-time Add-ons");
  L.push("");
  if (quote.addons && quote.addons.length) {
    quote.addons.forEach(function (a) {
      L.push("- " + a.label + " — **P" + fmt(a.price) + "**");
    });
  } else {
    L.push("- None");
  }
  L.push("");
  L.push("## Monthly & Care");
  L.push("");
  if (quote.monthly && quote.monthly.length) {
    quote.monthly.forEach(function (m) {
      L.push("- " + m.label + " — **P" + fmt(m.price) + "/" + m.per + "**");
    });
  } else {
    L.push("- None");
  }
  L.push("");
  L.push("## Totals");
  L.push("");
  if (quote.quoteOnly) {
    L.push("- One-time estimate — **Custom quote**");
  } else {
    L.push("- One-time estimate — **P" + fmt(quote.oneTimeTotal) + "**");
  }
  if (quote.monthlyRecurring > 0) {
    L.push("- Recurring — **P" + fmt(quote.monthlyRecurring) + "/month**");
  }
  L.push("");
  L.push("## Notes");
  L.push("");
  L.push(quote.notes ? "- " + quote.notes.replace(/\n/g, "\n  ") : "- None");
  return L.join("\n") + "\n";
}

// Client-facing confirmation — basic option list + final price only.
// NO per-option pricing.
function buildClientConfirmation(quote, contact) {
  var L = [];
  L.push("Hi! Thanks for your website quote request. Here's a quick summary:");
  L.push("");
  L.push("Site type: " + quote.siteType);
  if (!quote.quoteOnly) {
    L.push("Pages: " + pageCountText(quote));
  }
  var opts = (quote.addons || []).map(function (a) {
    return a.label;
  });
  var monthly = (quote.monthly || []).map(function (m) {
    return m.label + " (monthly)";
  });
  var all = opts.concat(monthly);
  L.push("Options: " + (all.length ? all.join(", ") : "None selected"));
  L.push("One-time estimate: " + (quote.quoteOnly ? "Custom quote" : "P" + fmt(quote.oneTimeTotal)));
  if (quote.monthlyRecurring > 0) {
    L.push("Recurring: P" + fmt(quote.monthlyRecurring) + "/month");
  }
  L.push("");
  L.push("I'll be in touch with the exact quote shortly.");
  L.push("— CabsCode");
  return L.join("\n");
}

function buildClientConfirmationHtml(quote, contact) {
  var rows = [];
  rows.push("<p><strong>Site type:</strong> " + escapeHtml(quote.siteType) + "</p>");
  if (!quote.quoteOnly) {
    rows.push("<p><strong>Pages:</strong> " + escapeHtml(pageCountText(quote)) + "</p>");
  }
  var opts = (quote.addons || []).map(function (a) {
    return "<li>" + escapeHtml(a.label) + "</li>";
  });
  var monthly = (quote.monthly || []).map(function (m) {
    return "<li>" + escapeHtml(m.label) + " (monthly)</li>";
  });
  var all = opts.concat(monthly);
  rows.push("<p><strong>Options:</strong></p><ul>" + (all.length ? all.join("") : "<li>None selected</li>") + "</ul>");
  rows.push(
    "<p><strong>One-time estimate:</strong> " +
      (quote.quoteOnly ? "Custom quote" : "P" + fmt(quote.oneTimeTotal)) +
      "</p>",
  );
  if (quote.monthlyRecurring > 0) {
    rows.push("<p><strong>Recurring:</strong> P" + fmt(quote.monthlyRecurring) + "/month</p>");
  }
  return [
    "<h2>Your Website Quote — CabsCode</h2>",
    rows.join(""),
    "<p>I'll be in touch with the exact quote shortly.</p>",
  ].join("");
}

// Owner-facing HTML breakdown with full pricing.
function buildOwnerHtml(quote, contact) {
  var L = [];
  L.push("<h2>New Website Quote Request</h2>");
  L.push("<p><strong>Date:</strong> " + todayISO() + "</p>");
  L.push("<p><strong>Contact:</strong> " + escapeHtml(contactLine(contact)) + "</p>");
  L.push("<p><strong>Site type:</strong> " + escapeHtml(quote.siteType) + "</p>");
  if (!quote.quoteOnly) {
    L.push("<p><strong>Pages:</strong> " + escapeHtml(pageDescription(quote)) + "</p>");
  }
  if (quote.addons && quote.addons.length) {
    L.push("<p><strong>One-time add-ons:</strong></p><ul>");
    quote.addons.forEach(function (a) {
      L.push("<li>" + escapeHtml(a.label) + " — P" + fmt(a.price) + "</li>");
    });
    L.push("</ul>");
  }
  if (quote.monthly && quote.monthly.length) {
    L.push("<p><strong>Monthly &amp; care:</strong></p><ul>");
    quote.monthly.forEach(function (m) {
      L.push("<li>" + escapeHtml(m.label) + " — P" + fmt(m.price) + "/" + escapeHtml(m.per) + "</li>");
    });
    L.push("</ul>");
  }
  L.push(
    "<p><strong>One-time estimate:</strong> " +
      (quote.quoteOnly ? "Custom quote" : "P" + fmt(quote.oneTimeTotal)) +
      "</p>",
  );
  if (quote.monthlyRecurring > 0) {
    L.push("<p><strong>Recurring:</strong> P" + fmt(quote.monthlyRecurring) + "/month</p>");
  }
  if (quote.notes) {
    L.push("<p><strong>Notes:</strong></p><p>" + escapeHtml(quote.notes).replace(/\n/g, "<br />") + "</p>");
  }
  L.push("<hr />");
  L.push("<p><em>Client confirmation sent separately. A .md copy of this quote is attached.</em></p>");
  return L.join("");
}

module.exports = {
  todayISO: todayISO,
  buildQuoteMarkdown: buildQuoteMarkdown,
  buildClientConfirmation: buildClientConfirmation,
  buildClientConfirmationHtml: buildClientConfirmationHtml,
  buildOwnerHtml: buildOwnerHtml,
};