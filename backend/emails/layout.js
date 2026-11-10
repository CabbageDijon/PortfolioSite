// Branded, table-based email shell. Inline styles only (email clients strip <style>).
const { escapeHtml } = require("../lib/util");

const SITE = {
  name: "CabsCode",
  url: "https://cabscode.pro",
  logo: "https://cabscode.pro/images/favicon.png",
  services: "https://cabscode.pro/services",
  studio: "https://cabscode.pro/studio",
  journal: "https://cabscode.pro/journal",
  location: "Gaborone, Botswana",
  owner: "Tema Bown",
};

const C = {
  bg: "#f4f7f5",
  card: "#ffffff",
  text: "#1a1a1a",
  body: "#3c3a3a",
  muted: "#6b6f72",
  border: "#e3e8e4",
  sage: "#a9bba2",
  green: "#077d4a",
  headerFrom: "#616b74",
  headerMid: "#222125",
  headerTo: "#39385a",
};

const FONT = "Inter, Arial, Helvetica, sans-serif";

function heading(text) {
  return (
    '<h1 style="margin:0 0 16px;font-family:' + FONT + ";font-size:24px;line-height:1.3;font-weight:700;color:" + C.text + ';">' +
    escapeHtml(text) +
    "</h1>"
  );
}

function paragraph(html) {
  return (
    '<p style="margin:0 0 16px;font-family:' + FONT + ";font-size:15px;line-height:1.6;color:" + C.body + ';">' +
    html +
    "</p>"
  );
}

function sectionLabel(text) {
  return (
    '<p style="margin:24px 0 8px;font-family:' + FONT + ";font-size:12px;letter-spacing:1.2px;text-transform:uppercase;font-weight:700;color:" + C.muted + ';">' +
    escapeHtml(text) +
    "</p>"
  );
}

function button(label, href) {
  return (
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 8px 8px 0;display:inline-table;">' +
    '<tr><td bgcolor="' + C.green + '" style="border-radius:8px;background:' + C.green + ';">' +
    '<a href="' + escapeHtml(href) + '" target="_blank" style="display:inline-block;padding:12px 22px;font-family:' + FONT +
    ';font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">' +
    escapeHtml(label) +
    "</a></td></tr></table>"
  );
}

function badge(text) {
  return (
    '<span style="display:inline-block;margin:0 0 14px;padding:5px 10px;border-radius:999px;background:' + C.sage +
    ";font-family:" + FONT + ";font-size:11px;font-weight:700;letter-spacing:1px;color:" + C.text + ';">' +
    escapeHtml(text) +
    "</span>"
  );
}

// rows: [[label, valueHtml], ...] — values are expected to be escaped already.
function detailTable(rows) {
  const body = rows
    .filter(function (r) { return r && r[1] !== undefined && r[1] !== null && r[1] !== ""; })
    .map(function (r, i) {
      const border = i === 0 ? "" : "border-top:1px solid " + C.border + ";";
      return (
        "<tr>" +
        '<td valign="top" style="padding:10px 12px;' + border + "width:38%;font-family:" + FONT + ";font-size:13px;font-weight:600;color:" + C.muted + ';">' +
        escapeHtml(r[0]) +
        "</td>" +
        '<td valign="top" style="padding:10px 12px;' + border + "font-family:" + FONT + ";font-size:14px;line-height:1.5;color:" + C.text + ';">' +
        r[1] +
        "</td></tr>"
      );
    })
    .join("");
  return (
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ' + C.border +
    ';border-radius:8px;border-collapse:separate;margin:0 0 16px;">' +
    body +
    "</table>"
  );
}

function quoteBlock(text) {
  return (
    '<div style="margin:0 0 16px;padding:14px 16px;border-left:4px solid ' + C.sage + ";background:" + C.bg +
    ";border-radius:0 8px 8px 0;font-family:" + FONT + ";font-size:15px;line-height:1.6;color:" + C.body + ';">' +
    escapeHtml(text).replace(/\n/g, "<br />") +
    "</div>"
  );
}

// opts: { preheader, body }
function renderLayout(opts) {
  const preheader = escapeHtml(opts.preheader || "");
  const year = new Date().getFullYear();
  const linkStyle = "color:" + C.muted + ";text-decoration:underline;";
  return (
    "<!doctype html>" +
    '<html lang="en"><head><meta charset="utf-8" />' +
    '<meta name="viewport" content="width=device-width, initial-scale=1" />' +
    '<meta name="color-scheme" content="light" /><meta name="supported-color-schemes" content="light" />' +
    "<title>" + SITE.name + "</title></head>" +
    '<body style="margin:0;padding:0;background:' + C.bg + ';">' +
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;">' + preheader + "</div>" +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + C.bg + '" style="background:' + C.bg + ';">' +
    '<tr><td align="center" style="padding:24px 12px;">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">' +
    // Header
    '<tr><td bgcolor="' + C.headerMid + '" style="padding:22px 28px;border-radius:12px 12px 0 0;background:' + C.headerMid +
    ";background-image:linear-gradient(135deg," + C.headerFrom + " 0%," + C.headerMid + " 50%," + C.headerTo + ' 100%);">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>' +
    '<td valign="middle" style="padding-right:12px;"><a href="' + SITE.url + '" target="_blank">' +
    '<img src="' + SITE.logo + '" width="40" height="40" alt="CabsCode" style="display:block;border:0;border-radius:8px;" /></a></td>' +
    '<td valign="middle" style="font-family:' + FONT + ';font-size:20px;font-weight:700;letter-spacing:0.3px;color:#ffffff;">' + SITE.name + "</td>" +
    "</tr></table></td></tr>" +
    // Accent rule
    '<tr><td bgcolor="' + C.sage + '" style="height:4px;line-height:4px;font-size:0;background:' + C.sage + ';">&nbsp;</td></tr>' +
    // Card
    '<tr><td bgcolor="' + C.card + '" style="padding:32px 28px;background:' + C.card + ';border-radius:0 0 12px 12px;">' +
    opts.body +
    "</td></tr>" +
    // Footer
    '<tr><td align="center" style="padding:20px 12px;font-family:' + FONT + ";font-size:12px;line-height:1.6;color:" + C.muted + ';">' +
    '<a href="' + SITE.services + '" style="' + linkStyle + '">Services</a> &middot; ' +
    '<a href="' + SITE.studio + '" style="' + linkStyle + '">Studio</a> &middot; ' +
    '<a href="' + SITE.journal + '" style="' + linkStyle + '">Journal</a><br />' +
    SITE.location + "<br />&copy; " + year + " " + SITE.owner + " &middot; " +
    '<a href="' + SITE.url + '" style="' + linkStyle + '">cabscode.pro</a>' +
    "</td></tr>" +
    "</table></td></tr></table></body></html>"
  );
}

module.exports = {
  renderLayout: renderLayout,
  button: button,
  heading: heading,
  paragraph: paragraph,
  sectionLabel: sectionLabel,
  detailTable: detailTable,
  quoteBlock: quoteBlock,
  badge: badge,
  SITE: SITE,
  C: C,
  FONT: FONT,
};
