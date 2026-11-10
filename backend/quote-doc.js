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
  L.push("I'll be in touch with your exact quote within 1-2 business days.");
  L.push("Questions in the meantime? Just reply to this email.");
  L.push("— CabsCode");
  return L.join("\n");
}

module.exports = {
  fmt: fmt,
  todayISO: todayISO,
  pageDescription: pageDescription,
  pageCountText: pageCountText,
  buildQuoteMarkdown: buildQuoteMarkdown,
  buildClientConfirmation: buildClientConfirmation,
};
