const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const USAGE_PATH = process.env.AUDIT_USAGE_PATH || path.join(__dirname, "audit-usage.json");
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const CSE_KEY = process.env.GOOGLE_CSE_KEY || "";
const CSE_CX = process.env.GOOGLE_CSE_CX || "";

function shaEmail(email) {
  return crypto.createHash("sha256").update(String(email).toLowerCase().trim()).digest("hex");
}

function loadUsage() {
  try {
    if (!fs.existsSync(USAGE_PATH)) return {};
    return JSON.parse(fs.readFileSync(USAGE_PATH, "utf8") || "{}");
  } catch (_) { return {}; }
}
function saveUsage(obj) {
  try { fs.writeFileSync(USAGE_PATH, JSON.stringify(obj, null, 2)); } catch (e) { console.error("usage save failed", e); }
}

function canFreeRun(email) {
  var u = loadUsage();
  var h = shaEmail(email);
  var rec = u[h];
  if (!rec || !rec.lastFreeAt) return { ok: true };
  var elapsed = Date.now() - rec.lastFreeAt;
  if (elapsed >= 7 * 24 * 60 * 60 * 1000) return { ok: true };
  var next = new Date(rec.lastFreeAt + 7 * 24 * 60 * 60 * 1000);
  return { ok: false, nextAt: next.toISOString() };
}
function markFreeRun(email) {
  var u = loadUsage();
  var h = shaEmail(email);
  u[h] = u[h] || {};
  u[h].lastFreeAt = Date.now();
  saveUsage(u);
}
function storeCode(email, code) {
  var u = loadUsage();
  var h = shaEmail(email);
  u[h] = u[h] || {};
  var hash = crypto.createHash("sha256").update(String(code)).digest("hex");
  u[h].codeHash = hash;
  u[h].codeExp = Date.now() + 15 * 60 * 1000;
  saveUsage(u);
}
function verifyCode(email, code) {
  var u = loadUsage();
  var h = shaEmail(email);
  var rec = u[h];
  if (!rec || !rec.codeHash || !rec.codeExp) return false;
  if (Date.now() > rec.codeExp) return false;
  var hash = crypto.createHash("sha256").update(String(code)).digest("hex");
  return hash === rec.codeHash;
}
function clearCode(email) {
  var u = loadUsage();
  var h = shaEmail(email);
  if (u[h]) { delete u[h].codeHash; delete u[h].codeExp; saveUsage(u); }
}

function verifyPayToken(token, email) {
  var secret = process.env.PAID_AUDIT_SECRET || "";
  if (!secret || !token) return false;
  try {
    var parts = token.split(".");
    if (parts.length !== 3) return false;
    var tier = parts[0]; var emailHash = parts[1]; var sig = parts[2];
    var expect = crypto.createHmac("sha256", secret).update(tier + ":" + shaEmail(email)).digest("hex").slice(0, 16);
    return sig === expect && shaEmail(email) === emailHash && (tier === "p50" || tier === "p100");
  } catch (_) { return false; }
}

async function geminiGenerate(promptObj, tier) {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");
  var url = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(GEMINI_MODEL) + ":generateContent?key=" + encodeURIComponent(GEMINI_API_KEY);
  var prompt = JSON.stringify(promptObj);
  // Single call per action enforced by caller; this helper does exactly one fetch.
  var body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.6, maxOutputTokens: tier === "p100" ? 1200 : tier === "p50" ? 700 : 500, responseMimeType: "application/json" }
  };
  var controller = new AbortController();
  var t = setTimeout(function () { controller.abort(); }, 25000);
  try {
    var res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: controller.signal });
    var txt = await res.text();
    if (!res.ok) throw new Error("Gemini " + res.status + ": " + txt.slice(0, 400));
    var data = JSON.parse(txt);
    var candidate = data.candidates && data.candidates[0];
    var text = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0] && candidate.content.parts[0].text;
    if (!text) throw new Error("Empty Gemini response");
    return JSON.parse(text);
  } finally { clearTimeout(t); }
}

function buildTermsPrompt(businessName, businessType, location, tier) {
  var n = tier === "p100" ? 10 : tier === "p50" ? 6 : 3;
  return {
    task: "Generate Google search terms for a Botswana SEO audit. Must include: 1) exact business name as-is, 2) business type + location (e.g. 'plumber Gaborone'), and variations for customers looking for this service. Location: " + location + ". Business type: " + businessType + ".",
    businessName: businessName,
    businessType: businessType,
    location: location,
    count: n,
    constraints: "Terms must be local-intent. Include 'near me' and 'best X location' variants. No duplicates. Output JSON { terms: [string] } with exactly " + n + " terms, first term is business name as-is.",
    output: "JSON only"
  };
}

function ensureMandatoryTerms(terms, businessName, businessType, location, n) {
  var out = terms.slice();
  var low = out.map(function (t) { return String(t).toLowerCase().trim(); });
  if (low.indexOf(String(businessName).toLowerCase().trim()) === -1) out.unshift(businessName);
  var combo = (businessType + " " + location).trim().toLowerCase();
  if (low.indexOf(combo) === -1 && out.length < n + 2) {
    if (out.length >= n) out.splice(1, 0, businessType + " " + location);
    else out.push(businessType + " " + location);
  }
  // dedupe
  var seen = {};
  var dedup = [];
  for (var i = 0; i < out.length; i++) { var k = String(out[i]).toLowerCase().trim(); if (!seen[k]) { seen[k] = 1; dedup.push(out[i]); } }
  return dedup.slice(0, n);
}

async function cseSearch(term, pages) {
  if (!CSE_KEY || !CSE_CX) return null; // no key -> mock
  var all = [];
  for (var p = 0; p < pages; p++) {
    var start = p * 10 + 1;
    var url = "https://www.googleapis.com/customsearch/v1?key=" + encodeURIComponent(CSE_KEY) + "&cx=" + encodeURIComponent(CSE_CX) + "&q=" + encodeURIComponent(term) + "&num=10&start=" + start;
    var controller = new AbortController();
    var t = setTimeout(function () { controller.abort(); }, 8000);
    try {
      var res = await fetch(url, { signal: controller.signal });
      var data = await res.json();
      if (!res.ok) { all.push({ error: data.error && data.error.message }); continue; }
      var items = (data.items || []).map(function (it, idx) { return { title: it.title, link: it.link, displayLink: it.displayLink, rank: start + idx }; });
      all.push({ page: p + 1, items: items });
    } catch (e) {
      all.push({ page: p + 1, error: String(e.message || e) });
    } finally { clearTimeout(t); }
  }
  return all;
}

function inferPresence(cseResults, targetUrl) {
  var hasWebsite = false; var hasSocial = false; var sites = [];
  for (var i = 0; i < cseResults.length; i++) {
    var r = cseResults[i];
    var pageItems = r.pages || [];
    for (var p = 0; p < pageItems.length; p++) {
      var page = pageItems[p];
      var items = page.items || [];
      for (var k = 0; k < items.length; k++) {
        var link = (items[k].link || "").toLowerCase();
        if (/facebook\.com|fb\.com|instagram\.com/.test(link)) hasSocial = true;
        else if (/^https?:\/\//.test(link)) hasWebsite = true;
        sites.push(link);
      }
    }
  }
  if (hasWebsite) return { isSocialOnly: false, label: "Website found on Google", hint: "Good — your site is indexed. Now tighten on-page basics and GBP." };
  if (hasSocial && !hasWebsite) return { isSocialOnly: true, label: "Social-only — no dedicated website indexed", hint: "You’re renting visibility from Facebook/Instagram. A small site (from P600) puts you in Google properly — see Website Price Estimator." };
  return { isSocialOnly: false, label: "Not clearly indexed yet", hint: "Add a site or GBP listing so Google can find you." };
}

async function fetchOnPage(url) {
  if (!url) return null;
  try {
    var u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    // SSRF block private
    var host = u.hostname;
    if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) return null;
    var controller = new AbortController();
    var t = setTimeout(function () { controller.abort(); }, 8000);
    var res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "CabsCode-Audit/1.0" }, redirect: "follow" });
    var html = await res.text();
    clearTimeout(t);
    var title = (html.match(/<title[^>]*>([^<]*)<\/title>/i) || [,""])[1].trim();
    var desc = (html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i) || [,""])[1].trim();
    var hasH1 = /<h1[\s>]/i.test(html);
    var canonical = /<link[^>]*rel=["']canonical["']/i.test(html);
    var viewport = /<meta[^>]*name=["']viewport["']/i.test(html);
    var og = /<meta[^>]*property=["']og:/i.test(html);
    var alts = (html.match(/<img[^>]*alt=/gi) || []).length;
    var imgs = (html.match(/<img/gi) || []).length;
    var checks = [
      { label: "Title tag", pass: !!title, detail: title ? title.slice(0, 60) : "missing" },
      { label: "Meta description", pass: !!desc, detail: desc ? desc.slice(0, 80) : "missing" },
      { label: "H1 heading", pass: hasH1, detail: hasH1 ? "found" : "no H1" },
      { label: "Canonical link", pass: canonical, detail: canonical ? "present" : "missing" },
      { label: "Viewport (mobile)", pass: viewport, detail: viewport ? "present" : "missing" },
      { label: "Open Graph tags", pass: og, detail: og ? "present" : "add for link previews" },
      { label: "Image alt text", pass: alts > 0, detail: alts + "/" + imgs + " with alt" },
      { label: "HTTPS", pass: u.protocol === "https:", detail: u.protocol },
    ];
    var score = checks.filter(function (c) { return c.pass; }).length;
    return { url: url, checks: checks, passCount: score, total: checks.length };
  } catch (e) {
    return { url: url, checks: [{ label: "Fetch", pass: false, detail: String(e.message || e).slice(0, 120) }], passCount: 0, total: 1, error: String(e.message || e) };
  }
}

function pickPreset(onPage, presence) {
  if (presence && presence.isSocialOnly) {
    return { id: "establish-website", title: "Establish a website", why: "Right now Google only finds your social profile. A dedicated site gives you a domain Google can rank, a Maps pin, and contact you own.", items: ["1–3 page site (Base from P600) with your name, services, and location", "Domain (yourname.co.bw) + WhatsApp & contact form", "Submit sitemap to Google Search Console"] };
  }
  if (onPage && onPage.passCount != null && onPage.passCount <= 4) {
    return { id: "improve-seo", title: "Improve website SEO", why: "Your site is indexed but on-page basics are weak. These fixes help Google understand and rank your pages.", items: ["Titles + meta descriptions for up to 5 pages", "One H1 per page + alt text on images", "Sitemap + Search Console + canonical & viewport fixes"] };
  }
  return { id: "setup-gbp", title: "Set up Google Business", why: "To show up for “near me” searches, claim your Google Business Profile and tie it to your site.", items: ["Claim & verify Google Business Profile (free)", "Add Maps pin, hours, categories, and site link", "Collect one review to unlock local ranking"] };
}

function buildAuditPrompt(payload, cseResults, onPage) {
  var compact = JSON.stringify({ business: payload, cse: cseResults, onPage: onPage }).slice(0, 6000);
  if (payload.tier === "p100") {
    return { task: "You are an SEO analyst. Given Google Custom Search results (3 pages, up to 10 terms) and on-page checks, produce a full Google AI SEO recommendation. Be concise, Botswana-local, no fluff. Output JSON { score: number 0-100, verdict: string (one line), recommendation: string (markdown, prioritized steps), fixes: string[5-8] }. Score weights: presence + titles/desc + H1 + GBP. Recommendation must be actionable.", context: compact };
  }
  if (payload.tier === "p50") {
    return { task: "You are an SEO analyst. Given CSE results (3 pages, 6 terms) and on-page checks, produce a lowdown: 4-6 sentences + 3 prioritized fixes. Output JSON { score: number 0-100, verdict: string, lowdown: string, fixes: string[3] }. Keep it minimal, local (Botswana).", context: compact };
  }
  return null; // free = no Gemini audit
}

module.exports = {
  GEMINI_MODEL: GEMINI_MODEL,
  shaEmail: shaEmail,
  canFreeRun: canFreeRun,
  markFreeRun: markFreeRun,
  storeCode: storeCode,
  verifyCode: verifyCode,
  clearCode: clearCode,
  verifyPayToken: verifyPayToken,
  geminiGenerate: geminiGenerate,
  buildTermsPrompt: buildTermsPrompt,
  ensureMandatoryTerms: ensureMandatoryTerms,
  cseSearch: cseSearch,
  inferPresence: inferPresence,
  fetchOnPage: fetchOnPage,
  pickPreset: pickPreset,
  buildAuditPrompt: buildAuditPrompt,
};
