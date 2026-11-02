// Add-ons showcase — every section IS the add-on: a working tool whose
// output (booking, post, snippet, download) you keep.
// Data (prices, icons, free-in tiers) renders from QUOTE_ADDONS / QUOTE_MONTHLY_ADDONS;
// the rail is a 6-group accordion with scrollspy sync. Payments stay sandbox +
// manual-confirm; booking/blog persist in this browser only (localStorage).
(function () {
  "use strict";

  var TIER_NAMES = { standard: "Standard", advanced: "Advanced", ecommerce: "E-commerce" };

  var GROUPS = [
    { id: "sell", title: "Book & Sell", icon: "shopping-bag", items: ["booking", "gateway", "momo"] },
    { id: "found", title: "Be Found", icon: "search", items: ["seo-basic", "seo", "google-business", "analytics"] },
    { id: "talk", title: "Talk to Clients", icon: "message-circle", items: ["whatsapp", "social"] },
    { id: "brand", title: "Content & Brand", icon: "palette", items: ["logo", "blog", "images", "multilang"] },
    { id: "base", title: "Foundations", icon: "layers", items: ["domain", "speed"] },
    { id: "care", title: "Monthly & Care", icon: "shield-check", items: ["maintenance", "support"] },
  ];

  // One-line showcase copy — the demos below do the explaining.
  var COPY = {
    logo: { line: "A starter mark + wordmark, favicon, and social avatar — type a name, download the kit. No full brand manual.", bestFor: "New businesses with no identity yet." },
    booking: { line: "Full custom scheduling on your site — pick a slot, confirm with your name, keep the booking + WhatsApp link + .ics.", bestFor: "Salons, barbers, gyms, clinics, driving schools." },
    gateway: { line: "Card payments via DPO Pay / PayGate, tested in sandbox before handover. Gateway fees stay yours.", bestFor: "Stores and lodges ready to take cards." },
    momo: { line: "Live Orange Money / MyZaka callbacks, so payments confirm themselves. Run the mock prompt.", bestFor: "Botswana stores paid by phone first." },
    multilang: { line: "A full-site English / Setswana switcher — every page, not machine translation. Flip it.", bestFor: "NGOs, tourism, anyone serving all of Botswana." },
    domain: { line: "12-month domain plus the full move to your host, verified live. Check a name.", bestFor: "Anyone without a domain yet." },
    "seo-basic": { line: "Hand-written titles + descriptions for up to 5 pages, shown as they'll appear on Google.", bestFor: "Every site — free from Standard up." },
    seo: { line: "Visibility foundations for up to 8 pages, including AI-listing SEO. Flip the comparison.", bestFor: "Businesses fighting for 'near me' searches." },
    "google-business": { line: "Profile claimed and verified, Maps tuned — full embed plus a footer map. The fastest win for walk-in trade.", bestFor: "Shops, salons, and trades with a physical spot." },
    whatsapp: { line: "Floating chat button with a pre-filled message — set your number + text, the button and snippet update live.", bestFor: "Every Botswana business." },
    blog: { line: "Publishing you run yourself, no database. Publish below — it saves in this browser, exports as blog.json.", bestFor: "Firms, schools, NGOs with news to share." },
    analytics: { line: "GA4 + Search Console wired to an account you own. This dashboard is sample data.", bestFor: "Anyone who wants to know what brings enquiries." },
    images: { line: "10 curated photos, WebP + responsive sizes. Upload your own images — compress + download them here.", bestFor: "New sites stuck waiting on photography." },
    speed: { line: "A full Lighthouse pass with fixes. Run the audit — it measures this page, then exports your report.", bestFor: "Image-heavy sites losing buyers to slow loads." },
    social: { line: "Your FB / IG grid embedded as static code — no API keys to babysit.", bestFor: "Businesses whose Instagram already sells." },
    maintenance: { line: "Monthly care priced from your build, with 1 micro-revision. Enter your build to see your band.", bestFor: "Anyone who wants the site kept fresh." },
    support: { line: "Ad-hoc help at P200/hour, tracked honestly. Pick your effort band.", bestFor: "Occasional changes, no commitment." },
  };

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function byId(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function freeLine(a) {
    var freeIn = a.freeIn || [];
    if (!freeIn.length) return "Available on every site type — never bundled free.";
    var names = freeIn.map(function (t) { return TIER_NAMES[t] || t; });
    return "Included free in <strong>" + esc(names.join(" + ")) + "</strong>.";
  }

  function pricePill(a) {
    if (a.price === null || a.price === undefined) {
      if (a.id === "maintenance") return "15% of build/mo";
      return "Custom";
    }
    return "P" + a.price + (a.per ? "/" + a.per : "");
  }

  /* ---------------- shared real-tool helpers (Phase 0) ---------------- */

  var LS_PREFIX = "cabscode.addons.";
  // Per-card config getters for "Request this" — binders register via aoConfig(id, fn).
  var AO_CONFIG = {};

  function aoConfig(id, fn) {
    AO_CONFIG[id] = fn;
  }

  function load(key, fb) {
    try {
      var raw = localStorage.getItem(LS_PREFIX + key);
      if (!raw) return fb;
      return JSON.parse(raw);
    } catch (e) { return fb; }
  }

  function save(key, val) {
    try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(val)); } catch (e) {}
  }

  function copyText(text, out, okMsg) {
    function done() {
      if (out) out.textContent = okMsg || "Copied — paste it into your site.";
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
    } else fallbackCopy(text, done);
  }

  function fallbackCopy(text, done) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
    if (done) done();
  }

  function download(filename, content, mime) {
    var blob = new Blob([content], { type: mime || "text/plain" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 400);
  }

  function downloadUrl(filename, url) {
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { document.body.removeChild(a); }, 400);
  }

  // "Add this in the estimator" → /services?addons=<id>#quote (preselected there).
  // "Request this" → pre-fills the footer contact form with this card's config.
  function wireCardActions(root, id) {
    var est = root.querySelector("[data-ao-estimate]");
    if (est) {
      est.setAttribute("href", "/services?addons=" + encodeURIComponent(id) + "#quote");
      est.addEventListener("click", function () {
        try { localStorage.setItem(LS_PREFIX + "pending", JSON.stringify([id])); } catch (e) {}
      });
    }
    var req = root.querySelector("[data-ao-request]");
    if (req) {
      req.addEventListener("click", function () {
        var cfg = "";
        try { cfg = AO_CONFIG[id] ? AO_CONFIG[id]() : ""; } catch (e) { cfg = ""; }
        var label = id;
        try {
          var all = (typeof QUOTE_ADDONS !== "undefined" ? QUOTE_ADDONS : [])
            .concat(typeof QUOTE_MONTHLY_ADDONS !== "undefined" ? QUOTE_MONTHLY_ADDONS : []);
          for (var i = 0; i < all.length; i++) if (all[i].id === id) { label = all[i].label; break; }
        } catch (e2) {}
        var msg = "Hi Tema, I'd like the add-on: " + label + " (P — confirm exact price).\n" +
          (cfg ? "My setup from the add-ons page:\n" + cfg + "\n" : "") +
          "Please confirm and include it in my quote.";
        var ta = document.getElementById("contact-message");
        if (ta) {
          ta.value = msg;
          try { if (typeof setContactService === "function") setContactService("Web Development"); } catch (e3) {}
          var form = document.getElementById("contactForm");
          if (form) form.scrollIntoView({ behavior: "smooth", block: "start" });
          else ta.scrollIntoView({ behavior: "smooth", block: "center" });
          try { ta.focus({ preventScroll: true }); } catch (e4) { try { ta.focus(); } catch (e5) {} }
        } else {
          copyText(msg, null);
          window.location.href = "/#contactForm";
        }
      });
    }
  }

  /* ---------------- live demo widgets (static markup; wired in bindDemos) ---------------- */

  var DEMOS = {
    booking:
      '<div class="ao-demo"><p class="ao-demo-tag">Real tool — bookings save in this browser. Nothing is sent.</p>' +
      '<div class="ao-field"><label>Your WhatsApp number (confirmations go here)</label><input type="tel" data-bk-owner value="26770000000" autocomplete="off" /></div>' +
      '<div class="ao-chip-row" data-bk-services>' +
      '<button type="button" data-dur="45 min" data-price="P180">Haircut · 45 min · P180</button>' +
      '<button type="button" data-dur="2 hrs" data-price="P650">Colour · 2 hrs · P650</button>' +
      '<button type="button" data-dur="1 hr" data-price="P250">Nails · 1 hr · P250</button></div>' +
      '<div class="ao-chip-row" data-bk-days></div>' +
      '<div class="ao-chip-row" data-bk-slots></div>' +
      '<div class="ao-row2"><div class="ao-field"><label>Your name</label><input type="text" data-bk-name placeholder="e.g. Neo K." autocomplete="off" /></div>' +
      '<div class="ao-field"><label>Your phone</label><input type="tel" data-bk-phone placeholder="+267 7XX XXX XXX" autocomplete="off" /></div></div>' +
      '<p class="ao-demo-out" data-bk-out>Choose a service, a day, and a time.</p>' +
      '<div class="ao-cta-row"><button type="button" class="solid-btn" data-bk-confirm>Confirm booking</button>' +
      '<button type="button" class="picker-cancel" data-bk-clear>My bookings: clear</button></div>' +
      '<div data-bk-list></div>' +
      '<div class="ao-cta-row"><a class="picker-cancel ao-link-btn" data-bk-wa target="_blank" rel="noopener" hidden>Confirm on WhatsApp</a>' +
      '<button type="button" class="picker-cancel" data-bk-ics hidden>Download .ics</button>' +
      '<button type="button" class="picker-cancel" data-bk-snippet>Copy embed snippet</button></div></div>',

    gateway:
      '<div class="ao-demo"><p class="ao-demo-tag">Sandbox — no real charge. Try 4242 4242 4242 4242.</p>' +
      '<div class="ao-field"><label>Card number</label><input type="text" data-gw-num inputmode="numeric" placeholder="4242 4242 4242 4242" autocomplete="off" /></div>' +
      '<div class="ao-row2"><div class="ao-field"><label>Expiry</label><input type="text" data-gw-exp inputmode="numeric" placeholder="MM/YY" autocomplete="off" /></div>' +
      '<div class="ao-field"><label>CVC</label><input type="text" data-gw-cvc inputmode="numeric" placeholder="123" autocomplete="off" /></div></div>' +
      '<button type="button" class="solid-btn" data-gw-pay>Pay P850 (sandbox)</button>' +
      '<p class="ao-demo-out" data-gw-out></p></div>',

    momo:
      '<div class="ao-demo"><p class="ao-demo-tag">Mock prompt — no money moves.</p>' +
      '<div class="ao-seg" data-mo-prov><button type="button" class="is-sel" data-p="Orange Money">Orange Money</button>' +
      '<button type="button" data-p="MyZaka">MyZaka</button></div>' +
      '<div class="ao-row2"><div class="ao-field"><label>Phone</label><input type="tel" data-mo-phone placeholder="+267 7XX XXX XXX" autocomplete="off" /></div>' +
      '<div class="ao-field"><label>Amount (P)</label><input type="text" data-mo-amt value="450" inputmode="decimal" autocomplete="off" /></div></div>' +
      '<button type="button" class="solid-btn" data-mo-send>Send prompt</button>' +
      '<p class="ao-demo-out" data-mo-out></p></div>',

    multilang:
      '<div class="ao-demo"><p class="ao-demo-tag">Working switcher — same pattern as the real build.</p>' +
      '<div class="ao-seg" data-ml-seg><button type="button" class="is-sel" data-l="en">English</button>' +
      '<button type="button" data-l="tn">Setswana</button></div>' +
      '<div class="ao-ml-card"><h3 data-ml-h></h3><p data-ml-p></p><span class="ao-ml-btn" data-ml-b></span></div></div>',

    domain:
      '<div class="ao-demo"><p class="ao-demo-tag">Process, not a lookup — availability is confirmed at registration.</p>' +
      '<div class="ao-field"><label>Your business name</label><input type="text" data-do-name placeholder="Your business name" autocomplete="off" /></div>' +
      '<button type="button" class="solid-btn" data-do-check>Check name</button>' +
      '<p class="ao-demo-out" data-do-out></p>' +
      '<ul class="ao-check"><li>12-month domain registered in your name</li><li>Files moved to your host</li>' +
      '<li>Domain tied to the website, verified live</li></ul></div>',

    "seo-basic":
      '<div class="ao-demo"><p class="ao-demo-tag">What the P250 pack covers — up to 5 pages.</p>' +
      '<ul class="ao-table" data-se-rows>' +
      "<li><span>Titles + descriptions (up to 5 pages)</span><b></b></li>" +
      "<li><span>Canonical + social tags</span><b></b></li>" +
      "<li><span>Google preview in shape</span><b></b></li>" +
      "<li><span>Head snippet ready to paste</span><b></b></li>" +
      "<li><span>Search Console check</span><b></b></li></ul>" +
      '<div class="ao-serp"><p class="ao-serp-url">cabscode.pro › demo-salon</p><p class="ao-serp-title" data-se-pt></p>' +
      '<p class="ao-serp-desc" data-se-pd></p></div>' +
      '<p class="ao-note">Illustrative preview — your pages render with your own text.</p></div>',

    seo:
      '<div class="ao-demo"><p class="ao-demo-tag">What the P700 pack adds.</p>' +
      '<div class="ao-seg" data-so-seg><button type="button" data-s="off">Without pack</button>' +
      '<button type="button" class="is-sel" data-s="on">With pack</button></div>' +
      '<ul class="ao-table" data-so-rows>' +
      "<li><span>Meta titles + descriptions (8 pages)</span><b></b></li>" +
      "<li><span>Sitemap.xml submitted</span><b></b></li>" +
      "<li><span>Search Console connected</span><b></b></li>" +
      "<li><span>llms.txt + AI-listing SEO</span><b></b></li>" +
      "<li><span>Structured data (ChatGPT / Perplexity)</span><b></b></li>" +
      "<li><span>One-page speed pass</span><b></b></li></ul>" +
      '<div class="ao-serp"><p class="ao-serp-url">cabscode.pro › demo-salon</p><p class="ao-serp-title" data-so-pt></p>' +
      '<p class="ao-serp-desc" data-so-pd></p></div>' +
      '<p class="ao-note">Illustrative preview — the pack ships rich results via structured data. Honest scope: no instant rankings; off-page links and copy excluded.</p></div>',

    "google-business":
      '<div class="ao-demo"><p class="ao-demo-tag">Mock profile · illustrative map location.</p>' +
      '<div class="ao-gbp"><p class="ao-gbp-name">Thebe Welding <span>(demo)</span></p>' +
      '<p class="ao-gbp-stars">★★★★★ 4.8 · 126 reviews</p>' +
      '<p class="ao-gbp-meta">Metal fabricator · Molepolole · Open till 18:00</p>' +
      '<p class="ao-gbp-rev">"Fixed my gate the same day. Fair price." — K. M.</p>' +
      '<p class="ao-gbp-rev">"Neat burglar bars, on time." — O. S.</p></div>' +
      '<div class="ao-seg" data-gb-seg><button type="button" class="is-sel" data-v="full">Full map</button>' +
      '<button type="button" data-v="foot">Footer</button></div>' +
      '<div data-gb-full><iframe title="Illustrative map" class="ao-map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" ' +
      'src="https://www.google.com/maps?q=Main+Mall+Gaborone&output=embed"></iframe></div>' +
      '<div data-gb-foot hidden><div class="ao-footer-mock"><div class="ao-footer-mock-info">' +
      '<p class="ao-footer-mock-name">Thebe Welding <span>(demo)</span></p>' +
      '<p>Molepolole · Open till 18:00</p>' +
      '<a href="https://www.google.com/maps?q=Main+Mall+Gaborone" target="_blank" rel="noopener">Get directions</a></div>' +
      '<iframe title="Illustrative footer map" class="ao-map ao-map-foot" loading="lazy" referrerpolicy="no-referrer-when-downgrade" ' +
      'src="https://www.google.com/maps?q=Main+Mall+Gaborone&output=embed"></iframe></div>' +
      '<div class="ao-cta-row"><button type="button" class="picker-cancel" data-gb-snippet>Copy footer-map snippet</button></div></div></div>',

    whatsapp:
      '<div class="ao-demo"><p class="ao-demo-tag">Real tool — the green button opens WhatsApp with your text.</p>' +
      '<div class="ao-row2"><div class="ao-field"><label>Business WhatsApp number</label><input type="tel" data-wa-num value="26770000000" autocomplete="off" /></div>' +
      '<div class="ao-field"><label>Button label</label><input type="text" data-wa-label value="Chat on WhatsApp" autocomplete="off" /></div></div>' +
      '<div class="ao-field"><label>Pre-filled message</label><textarea rows="2" data-wa-msg>Hi! I found you via your website.</textarea></div>' +
      '<p class="ao-demo-out" data-wa-link></p>' +
      '<div class="ao-wa-row"><a class="ao-wa-btn" data-wa-btn target="_blank" rel="noopener" ' +
      'href="https://wa.me/26770000000?text=Hi!%20I%20found%20you%20via%20the%20add-ons%20page.">Chat on WhatsApp</a>' +
      '<div class="ao-phone"><p class="ao-phone-bar">WhatsApp · preview</p>' +
      '<p class="ao-bubble in" data-wa-bubble-in>Hi! I found you via your website.</p>' +
      '<p class="ao-bubble out">Dumela! How can we help? 🛠️</p></div></div>' +
      '<div class="ao-cta-row"><button type="button" class="picker-cancel" data-wa-snippet>Copy floating-widget snippet</button></div></div>',

    blog:
      '<div class="ao-demo"><p class="ao-demo-tag">Real tool — posts save in this browser. Export keeps them.</p>' +
      '<div data-bl-list></div>' +
      '<div class="ao-field"><label>Post title</label><input type="text" data-bl-title placeholder="e.g. December holiday hours" autocomplete="off" /></div>' +
      '<div class="ao-field"><label>Body (supports **bold**, *italic*, [links](https://…), - lists)</label><textarea rows="2" data-bl-body placeholder="One or two sentences…"></textarea></div>' +
      '<div class="ao-cta-row"><button type="button" class="solid-btn" data-bl-pub>Publish post</button>' +
      '<button type="button" class="picker-cancel" data-bl-export>Download blog.json</button>' +
      '<button type="button" class="picker-cancel" data-bl-snippet>Copy site snippet</button></div></div>',

    analytics:
      '<div class="ao-demo"><p class="ao-demo-tag">Sample data — yours would be real.</p>' +
      '<div class="ao-stats"><div><b>1,240</b><span>visitors / mo</span></div>' +
      "<div><b>86</b><span>enquiries / mo</span></div>" +
      "<div><b>/services</b><span>top page</span></div></div>" +
      '<div class="ao-bars">' +
      "<div style=\"--h:38%\"><span>M</span></div><div style=\"--h:62%\"><span>T</span></div>" +
      "<div style=\"--h:50%\"><span>W</span></div><div style=\"--h:78%\"><span>T</span></div>" +
      "<div style=\"--h:68%\"><span>F</span></div><div style=\"--h:92%\"><span>S</span></div>" +
      '<div style="--h:84%"><span>S</span></div></div></div>',

    images:
      '<div class="ao-demo"><p class="ao-demo-tag">Real tool — compress your own images in this browser. Nothing is uploaded.</p>' +
      '<div class="ao-field"><label>Choose images (JPG/PNG, stays on your device)</label><input type="file" data-im-file accept="image/png,image/jpeg,image/webp" multiple /></div>' +
      '<div class="ao-row2"><div class="ao-field"><label>Format</label><select data-im-fmt><option value="image/webp" selected>WebP (smallest)</option><option value="image/jpeg">JPEG</option></select></div>' +
      '<div class="ao-field"><label>Quality: <b data-im-qn>80%</b></label><input type="range" data-im-q min="40" max="92" value="80" /></div></div>' +
      '<p class="ao-demo-out" data-im-out>Pick images to compress them here.</p><div class="ao-im-row" data-im-row></div>' +
      '<div class="ao-cta-row"><button type="button" class="picker-cancel" data-im-html hidden>Copy srcset HTML</button></div></div>',

    speed:
      '<div class="ao-demo"><p class="ao-demo-tag">Real tool — audits this page on your device, then exports the report.</p>' +
      '<button type="button" class="solid-btn" data-sp-run>Run audit</button>' +
      '<ul class="ao-check" data-sp-list><li>Compress images</li><li>Lazy-load below the fold</li>' +
      "<li>Minify CSS + JS</li><li>Cache static assets</li><li>Preconnect fonts</li></ul>" +
      '<pre class="ao-snippet" data-sp-report hidden></pre>' +
      '<p class="ao-demo-out" data-sp-out></p>' +
      '<div class="ao-cta-row"><button type="button" class="picker-cancel" data-sp-copy hidden>Copy report</button>' +
      '<a class="picker-cancel ao-link-btn" href="https://pagespeed.web.dev/" target="_blank" rel="noopener">Verify on PageSpeed</a></div></div>',

    social:
      '<div class="ao-demo"><p class="ao-demo-tag">Static embed — no API keys to babysit.</p>' +
      '<div class="ao-tiles"><div>📸<span>2.1k</span></div><div>💇<span>1.8k</span></div><div>💅<span>3.4k</span></div>' +
      "<div>✂️<span>990</span></div><div>🌸<span>1.2k</span></div><div>💈<span>2.7k</span></div></div>" +
      '<p class="ao-note">@glowandgo.bw · follow button lives on the real embed</p></div>',

    maintenance:
      '<div class="ao-demo"><p class="ao-demo-tag">Care priced from your build — exact figure in the estimator.</p>' +
      '<div class="ao-row2"><div class="ao-field"><label>One-off build (P)</label>' +
      '<input type="text" data-mn-cost placeholder="e.g. 2000" inputmode="decimal" autocomplete="off" /></div>' +
      '<div class="ao-field"><label>Tier</label><select data-mn-tier><option value="base">Base</option>' +
      '<option value="standard" selected>Standard</option><option value="advanced">Advanced</option>' +
      '<option value="ecommerce">E-commerce</option></select></div></div>' +
      '<p class="ao-demo-out" data-mn-out>Enter your build to see your band.</p>' +
      '<p class="ao-note">Includes 1 micro-revision a month — text, images, contact updates.</p></div>',

    support:
      '<div class="ao-demo"><p class="ao-demo-tag">P200 per hour, tracked honestly.</p>' +
      '<label class="ao-range">Effort needed: <b data-su-n>Small fix</b>' +
      '<input type="range" data-su-range min="1" max="20" value="3" /></label>' +
      '<p class="ao-demo-out" data-su-out></p>' +
      '<p class="ao-note">Exact total in the estimator.</p></div>',

    logo:
      '<div class="ao-demo"><p class="ao-demo-tag">Real tool — type a name, download the starter kit.</p>' +
      '<div class="ao-row2"><div class="ao-field"><label>Business name</label><input type="text" data-lg-name value="Thebe Welding" autocomplete="off" /></div>' +
      '<div class="ao-field"><label>Colour</label><input type="color" data-lg-color value="#077d4a" /></div></div>' +
      '<div class="ao-field"><label>Mark style</label><select data-lg-style><option value="initial" selected>Initial letter</option><option value="word">Wordmark block</option><option value=" Bolt">Bolt mark</option></select></div>' +
      '<div class="ao-logo-row"><span class="ao-logo-mark" data-lg-mark>T</span>' +
      '<div><p class="ao-logo-word" data-lg-word>THEBE <b>WELDING</b></p>' +
      '<p class="ao-note">Wordmark · favicon 32px <span class="ao-fav" data-lg-fav>T</span> · avatar <span class="ao-ava" data-lg-ava>T</span></p></div></div>' +
      '<div class="ao-cta-row"><button type="button" class="picker-cancel" data-lg-svg>Download logo.svg</button>' +
      '<button type="button" class="picker-cancel" data-lg-png>Download favicon.png</button>' +
      '<button type="button" class="picker-cancel" data-lg-snippet>Copy head snippet</button></div>' +
      '<p class="ao-demo-out" data-lg-out></p>' +
      '<p class="ao-note">AI-drafted, human-refined. A full brand manual is a different project.</p></div>',
  };

  function sectionHtml(a, g) {
    var copy = COPY[a.id] || { line: a.tip || "", bestFor: "" };
    return (
      '<section class="ao-section" id="addon-' + a.id + '" data-group="' + g.id + '">' +
      '<div class="ao-section-head">' +
      '<span class="ao-icon"><i data-lucide="' + esc(a.icon || "plus") + '"></i></span>' +
      "<h2>" + esc(a.label) + "</h2>" +
      '<span class="ao-price">' + esc(pricePill(a)) + "</span>" +
      "</div>" +
      '<p class="ao-body">' + esc(copy.line) + "</p>" +
      (copy.bestFor ? '<p class="ao-best"><strong>Best for:</strong> ' + esc(copy.bestFor) + "</p>" : "") +
      '<p class="ao-free">' + freeLine(a) + "</p>" +
      (DEMOS[a.id] || "") +
      '<div class="ao-cta-row">' +
      '<a class="solid-btn ao-cta" data-ao-estimate href="/services?addons=' + esc(a.id) + '#quote">Add this in the estimator ' +
      '<i data-lucide="arrow-right" class="icon-inline"></i></a>' +
      '<button type="button" class="picker-cancel ao-cta-ghost" data-ao-request>Request this</button>' +
      "</div>" +
      "</section>"
    );
  }

  /* ---------------- widget wiring ---------------- */

  function num(v, fb) {
    v = parseFloat(String(v || "").replace(/[^0-9.]/g, ""));
    return isNaN(v) ? fb : v;
  }

  function bindBooking(root) {
    var svc = null, day = -1, slot = null, lastBooking = null;
    var svcBtns = root.querySelectorAll("[data-bk-services] button");
    var daysEl = root.querySelector("[data-bk-days]");
    var slotsEl = root.querySelector("[data-bk-slots]");
    var out = root.querySelector("[data-bk-out]");
    var listEl = root.querySelector("[data-bk-list]");
    var waBtn = root.querySelector("[data-bk-wa]");
    var icsBtn = root.querySelector("[data-bk-ics]");
    var ownerEl = root.querySelector("[data-bk-owner]");
    var nameEl = root.querySelector("[data-bk-name]");
    var phoneEl = root.querySelector("[data-bk-phone]");
    var dayNames = [], dayDates = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(Date.now() + i * 86400000);
      dayDates.push(d);
      dayNames.push(d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }));
    }
    daysEl.innerHTML = dayNames.map(function (n, i) {
      return '<button type="button" data-day="' + i + '">' + esc(n) + "</button>";
    }).join("");
    var times = ["09:00", "10:30", "12:00", "14:00", "15:30"];
    function bookings() { return load("booking", []); }
    function paint() {
      var msg = "Choose a service, a day, and a time.";
      if (svc && day > -1 && slot) {
        msg = "Ready: " + svc + " · " + dayNames[day] + " · " + slot + " — add your name and confirm.";
      } else if (svc && day > -1) msg = svc + " · " + dayNames[day] + " — now pick a time.";
      else if (svc) msg = svc + " — now pick a day.";
      out.textContent = msg;
    }
    function paintList() {
      var all = bookings();
      if (!all.length) {
        listEl.innerHTML = '<p class="ao-note">No bookings yet in this browser. Confirm one above — it saves here.</p>';
        return;
      }
      listEl.innerHTML = '<p class="ao-note">My bookings (' + all.length + ", this browser only):</p>" +
        all.map(function (b, i) {
          return '<article class="ao-post"><h4>' + esc(b.ref) + " · " + esc(b.svc) + '</h4><p>' +
            esc(b.day) + " · " + esc(b.slot) + " · " + esc(b.name) + "</p><small>" + esc(b.phone || "") +
            ' · <button type="button" data-bk-del="' + i + '" class="ao-mini-del">Cancel</button></small></article>';
        }).join("");
      listEl.querySelectorAll("[data-bk-del]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var arr = bookings();
          arr.splice(parseInt(btn.getAttribute("data-bk-del"), 10), 1);
          save("booking", arr);
          paintList();
        });
      });
    }
    function refreshConfirmButtons() {
      var show = !!lastBooking;
      if (waBtn) waBtn.hidden = !show;
      if (icsBtn) icsBtn.hidden = !show;
      if (show && waBtn) {
        var owner = (ownerEl.value || "").replace(/\D/g, "") || "26770000000";
        var text = "Hi! Booking " + lastBooking.ref + ": " + lastBooking.svc + " on " +
          lastBooking.day + " at " + lastBooking.slot + " (" + lastBooking.name + ").";
        waBtn.href = "https://wa.me/" + owner + "?text=" + encodeURIComponent(text);
      }
    }
    svcBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        svcBtns.forEach(function (x) { x.classList.remove("is-sel"); });
        b.classList.add("is-sel");
        svc = b.textContent.trim();
        paint();
      });
    });
    daysEl.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        daysEl.querySelectorAll("button").forEach(function (x) { x.classList.remove("is-sel"); });
        b.classList.add("is-sel");
        day = parseInt(b.getAttribute("data-day"), 10);
        slot = null;
        var takenIdx = bookings().filter(function (x) { return x.day === dayNames[day]; }).length;
        slotsEl.innerHTML = times.map(function (t, i) {
          var taken = (day * 3 + i + takenIdx) % 4 === 0;
          return '<button type="button" data-slot="' + t + '"' + (taken ? " disabled" : "") + ">" + t + (taken ? " ✕" : "") + "</button>";
        }).join("");
        slotsEl.querySelectorAll("button:not([disabled])").forEach(function (s) {
          s.addEventListener("click", function () {
            slotsEl.querySelectorAll("button").forEach(function (x) { x.classList.remove("is-sel"); });
            s.classList.add("is-sel");
            slot = s.getAttribute("data-slot");
            paint();
          });
        });
        paint();
      });
    });
    root.querySelector("[data-bk-confirm]").addEventListener("click", function () {
      var name = nameEl.value.trim();
      var phone = phoneEl.value.trim();
      if (!svc || day < 0 || !slot) { out.textContent = "Pick a service, day, and time first."; return; }
      if (!name) { out.textContent = "Add your name so the business knows who is coming."; return; }
      var ref = "BK-" + Math.random().toString(36).slice(2, 6).toUpperCase();
      lastBooking = { ref: ref, svc: svc, day: dayNames[day], slot: slot, name: name, phone: phone, created: new Date().toISOString() };
      var arr = bookings();
      arr.unshift(lastBooking);
      save("booking", arr);
      out.textContent = "Booked: " + ref + " · " + svc + " · " + dayNames[day] + " · " + slot + " — saved in this browser.";
      paintList();
      refreshConfirmButtons();
    });
    root.querySelector("[data-bk-clear]").addEventListener("click", function () {
      save("booking", []);
      lastBooking = null;
      refreshConfirmButtons();
      paintList();
      out.textContent = "Cleared. Your bookings live only in this browser.";
    });
    if (icsBtn) icsBtn.addEventListener("click", function () {
      if (!lastBooking) return;
      var dt = dayDates[day] || new Date();
      var hm = (lastBooking.slot || "09:00").split(":");
      dt = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), parseInt(hm[0], 10) || 9, parseInt(hm[1], 10) || 0, 0);
      function ics(d) {
        return d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2) +
          "T" + ("0" + d.getHours()).slice(-2) + ("0" + d.getMinutes()).slice(-2) + "00";
      }
      var end = new Date(dt.getTime() + 60 * 60 * 1000);
      var body = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT",
        "UID:" + lastBooking.ref + "@cabscode.pro", "DTSTART:" + ics(dt), "DTEnd:" + ics(end).toUpperCase().replace("DTEND", "DTEND"),
        "SUMMARY:" + lastBooking.svc + " (" + lastBooking.ref + ")",
        "DESCRIPTION:Booked via add-ons page. " + lastBooking.name,
        "END:VEVENT", "END:VCALENDAR"].join("\r\n").replace("DTEnd:", "DTEND:");
      download(lastBooking.ref + ".ics", body, "text/calendar");
    });
    root.querySelector("[data-bk-snippet]").addEventListener("click", function () {
      var snip = '<!-- Booking add-on: services, days, slots, WhatsApp confirm -->\n' +
        '<div class="booking-widget" data-booking="true">\n' +
        '  <div data-bk-services><!-- your service buttons --></div>\n' +
        '  <div data-bk-days></div>\n  <div data-bk-slots></div>\n' +
        '  <a href="https://wa.me/26770000000?text=Hi!%20I%27d%20like%20to%20book">Confirm on WhatsApp</a>\n</div>';
      copyText(snip, out, "Embed snippet copied — this is the pattern shipped in the P700 build.");
    });
    aoConfig("booking", function () {
      var arr = bookings();
      return "Bookings in browser: " + arr.length + (lastBooking ? ". Latest: " + lastBooking.ref + " " + lastBooking.svc + " " + lastBooking.day + " " + lastBooking.slot : "") + ". Owner no: " + ((ownerEl && ownerEl.value) || "");
    });
    paint();
    paintList();
    refreshConfirmButtons();
  }

  function luhnOk(digits) {
    var sum = 0, dbl = false;
    for (var i = digits.length - 1; i >= 0; i--) {
      var n = parseInt(digits[i], 10);
      if (dbl) { n *= 2; if (n > 9) n -= 9; }
      sum += n;
      dbl = !dbl;
    }
    return sum % 10 === 0;
  }

  function bindGateway(root) {
    var number = root.querySelector("[data-gw-num]");
    var exp = root.querySelector("[data-gw-exp]");
    var cvc = root.querySelector("[data-gw-cvc]");
    var out = root.querySelector("[data-gw-out]");
    number.addEventListener("input", function () {
      var d = number.value.replace(/\D/g, "").slice(0, 16);
      number.value = d.replace(/(\d{4})(?=\d)/g, "$1 ");
    });
    exp.addEventListener("input", function () {
      var d = exp.value.replace(/\D/g, "").slice(0, 4);
      exp.value = d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
    });
    root.querySelector("[data-gw-pay]").addEventListener("click", function () {
      var d = number.value.replace(/\D/g, "");
      var okExp = /^(0[1-9]|1[0-2])\/\d{2}$/.test(exp.value);
      var okCvc = /^\d{3,4}$/.test(cvc.value.replace(/\D/g, ""));
      if (d.length !== 16 || !luhnOk(d)) { out.textContent = "That card number does not look right — check the digits."; return; }
      if (!okExp) { out.textContent = "Expiry should read MM/YY."; return; }
      if (!okCvc) { out.textContent = "CVC is the 3 digits on the back."; return; }
      out.textContent = "Approved (sandbox): P850 held, ref DPO-SANDBOX-" +
        Math.floor(1000 + Math.random() * 9000) + ". No real charge.";
    });
  }

  function bindMomo(root) {
    var prov = "Orange Money", timer = null;
    var out = root.querySelector("[data-mo-out]");
    var send = root.querySelector("[data-mo-send]");
    root.querySelectorAll("[data-mo-prov] button").forEach(function (b) {
      b.addEventListener("click", function () {
        root.querySelectorAll("[data-mo-prov] button").forEach(function (x) { x.classList.remove("is-sel"); });
        b.classList.add("is-sel");
        prov = b.getAttribute("data-p");
      });
    });
    send.addEventListener("click", function () {
      if (timer) return;
      var phone = root.querySelector("[data-mo-phone]").value.trim() || "+267 7XX XXX XXX";
      var amt = num(root.querySelector("[data-mo-amt]").value, 450);
      send.disabled = true;
      out.textContent = "Prompt sent to " + phone + " (" + prov + ") — approve on the phone… 3";
      var n = 3;
      timer = setInterval(function () {
        n--;
        if (n <= 0) {
          clearInterval(timer);
          timer = null;
          send.disabled = false;
          out.textContent = "Approved (demo): P" + amt + " received via " + prov + ". No money moved.";
        } else out.textContent = "Prompt sent to " + phone + " (" + prov + ") — approve on the phone… " + n;
      }, 800);
    });
  }

  var ML = {
    en: { h: "Pure water, delivered.", p: "Bottled purity and filtration across Botswana.", b: "See our solutions" },
    tn: { h: "Metsi a phepa, a a tlisitsweng.", p: "Metsi a dibotlolo le tlhotlhomiso mo Botswana yotlhe.", b: "Bona ditharabololo" },
  };

  function bindMultilang(root) {
    var h = root.querySelector("[data-ml-h]");
    var p = root.querySelector("[data-ml-p]");
    var b = root.querySelector("[data-ml-b]");
    function set(l) {
      h.textContent = ML[l].h;
      p.textContent = ML[l].p;
      b.textContent = ML[l].b;
      root.querySelectorAll("[data-ml-seg] button").forEach(function (x) {
        x.classList.toggle("is-sel", x.getAttribute("data-l") === l);
      });
    }
    root.querySelectorAll("[data-ml-seg] button").forEach(function (x) {
      x.addEventListener("click", function () { set(x.getAttribute("data-l")); });
    });
    set("en");
  }

  function bindDomain(root) {
    var out = root.querySelector("[data-do-out]");
    root.querySelector("[data-do-check]").addEventListener("click", function () {
      var name = root.querySelector("[data-do-name]").value.trim();
      if (!name) { out.textContent = "Type a business name first."; return; }
      if (!/[a-zA-Z0-9]/.test(name)) { out.textContent = "That name has no letters to build a domain from."; return; }
      out.textContent = "Good name to check — availability is confirmed live at registration, then I register, move and verify.";
    });
    aoConfig("domain", function () {
      var name = root.querySelector("[data-do-name]").value.trim();
      return name ? "Business name: " + name.slice(0, 60) : "No name entered yet";
    });
  }

  function bindGoogleBusiness(root) {
    var full = root.querySelector("[data-gb-full]");
    var foot = root.querySelector("[data-gb-foot]");
    root.querySelectorAll("[data-gb-seg] button").forEach(function (b) {
      b.addEventListener("click", function () {
        var showFoot = b.getAttribute("data-v") === "foot";
        full.hidden = showFoot;
        foot.hidden = !showFoot;
        root.querySelectorAll("[data-gb-seg] button").forEach(function (x) {
          x.classList.toggle("is-sel", x === b);
        });
      });
    });
    root.querySelector("[data-gb-snippet]").addEventListener("click", function () {
      copyText('<!-- Maps add-on: tuned footer map (replace YOUR_ADDRESS) -->\n<div class="footer-map">\n' +
        '  <iframe src="https://www.google.com/maps?q=YOUR_ADDRESS&output=embed"\n' +
        '    width="100%" height="150" style="border:0; filter:grayscale(40%) contrast(1.05);"\n' +
        '    loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>\n</div>', null);
    });
    aoConfig("google-business", function () {
      return "Profile claim + verify, tuned Maps embed + footer map";
    });
  }

  function bindSeoBasic(root) {
    // Static scope card — list + illustrative Google mock, no inputs.
    var pt = root.querySelector("[data-se-pt]");
    var pd = root.querySelector("[data-se-pd]");
    if (pt) pt.textContent = "Glow & Go Salon | Hair & Nails in Block 8, Gaborone";
    if (pd) pd.textContent = "Cuts, colour and nails in Block 8 with upfront prices. Book online in one tap — walk-ins welcome.";
    root.querySelectorAll("[data-se-rows] li").forEach(function (li) {
      li.classList.add("is-on");
      li.querySelector("b").textContent = "✓";
    });
    aoConfig("seo-basic", function () {
      return "Basic SEO — titles + descriptions, up to 5 pages";
    });
  }

  function bindSeoPack(root) {
    var rows = root.querySelectorAll("[data-so-rows] li");
    function set(on) {
      rows.forEach(function (li) {
        li.classList.toggle("is-on", on);
        li.classList.toggle("is-off", !on);
        li.querySelector("b").textContent = on ? "✓" : "✕";
      });
      root.querySelectorAll("[data-so-seg] button").forEach(function (x) {
        x.classList.toggle("is-sel", (x.getAttribute("data-s") === "on") === on);
      });
    }
    root.querySelectorAll("[data-so-seg] button").forEach(function (x) {
      x.addEventListener("click", function () { set(x.getAttribute("data-s") === "on"); });
    });
    // Illustrative SERP — same fake-Google-result pattern as Basic SEO.
    var soPt = root.querySelector("[data-so-pt]");
    var soPd = root.querySelector("[data-so-pd]");
    if (soPt) soPt.textContent = "Glow & Go Salon ★ 4.8 — Hair & Nails in Block 8, Gaborone";
    if (soPd) soPd.textContent = "Cuts, colour and nails in Block 8 with upfront prices. Book online in one tap — walk-ins welcome.";
    set(true);
  }

  function mdLite(src) {
    var h = esc(src);
    h = h.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    h = h.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    h = h.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    h = h.split("\n").map(function (line) {
      if (/^\s*-\s+/.test(line)) return "• " + line.replace(/^\s*-\s+/, "");
      return line;
    }).join("<br>");
    return h;
  }

  function bindBlog(root) {
    var seed = [
      { t: "Holiday hours", b: "Closed 25–26 Dec, back on the 27th.", when: "2 Dec 2026", ts: 1 },
      { t: "New: bulk delivery", b: "Tank filling across Gaborone from P350.", when: "18 Nov 2026", ts: 0 },
    ];
    var posts = load("blog", null) || seed.slice();
    var list = root.querySelector("[data-bl-list]");
    function persist() { save("blog", posts); }
    function paint() {
      list.innerHTML = posts.map(function (p, i) {
        return '<article class="ao-post"><h4>' + esc(p.t) + '</h4><p>' + mdLite(p.b) + "</p><small>" + esc(p.when) +
          ' · <button type="button" data-bl-del="' + i + '" class="ao-mini-del">Delete</button></small></article>';
      }).join("") + '<p class="ao-note">Saved in this browser (' + posts.length + "). Export keeps them forever.</p>";
      list.querySelectorAll("[data-bl-del]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          posts.splice(parseInt(btn.getAttribute("data-bl-del"), 10), 1);
          persist();
          paint();
        });
      });
    }
    root.querySelector("[data-bl-pub]").addEventListener("click", function () {
      var t = root.querySelector("[data-bl-title]").value.trim();
      var b = root.querySelector("[data-bl-body]").value.trim();
      if (!t || !b) return;
      posts.unshift({ t: t, b: b, when: "Just now · saved here", ts: Date.now() });
      root.querySelector("[data-bl-title]").value = "";
      root.querySelector("[data-bl-body]").value = "";
      persist();
      paint();
    });
    root.querySelector("[data-bl-export]").addEventListener("click", function () {
      download("blog.json", JSON.stringify(posts.map(function (p) { return { title: p.t, body: p.b, date: p.when }; }), null, 2), "application/json");
    });
    root.querySelector("[data-bl-snippet]").addEventListener("click", function () {
      copyText("<!-- Blog add-on: self-serve, no database -->\n<div id=\"blog-list\"></div>\n<script>\nfetch('/content/blog.json').then(r=>r.json()).then(posts=>{\n  document.getElementById('blog-list').innerHTML = posts.map(p=>'<article><h3>'+p.title+'</h3><p>'+p.body+'</p></article>').join('');\n});\n<\/script>\n<!-- Or Decap CMS: add admin/config.yml + admin/index.html, posts in /content/*.md -->", null);
    });
    aoConfig("blog", function () { return posts.length + " posts in browser. Latest: " + (posts[0] ? posts[0].t : "none"); });
    paint();
  }

  function bindImages(root) {
    var out = root.querySelector("[data-im-out]");
    var row = root.querySelector("[data-im-row]");
    var fileEl = root.querySelector("[data-im-file]");
    var qEl = root.querySelector("[data-im-q]");
    var qnEl = root.querySelector("[data-im-qn]");
    var fmtEl = root.querySelector("[data-im-fmt]");
    var htmlBtn = root.querySelector("[data-im-html]");
    var results = [];
    function kb(n) { return n > 1024 ? (n / 1024).toFixed(1) + " KB" : Math.round(n) + " B"; }
    function quality() { return (parseInt(qEl.value, 10) || 80) / 100; }
    qEl.addEventListener("input", function () { qnEl.textContent = qEl.value + "%"; });
    fileEl.addEventListener("change", function () {
      var files = Array.prototype.slice.call(fileEl.files || []);
      if (!files.length) return;
      row.innerHTML = "";
      results = [];
      out.textContent = "Compressing " + files.length + " image(s)…";
      var pending = files.length;
      files.slice(0, 6).forEach(function (file) {
        var url = URL.createObjectURL(file);
        var img = new Image();
        img.onload = function () {
          var maxW = 1600;
          var scale = Math.min(1, maxW / img.naturalWidth);
          var c = document.createElement("canvas");
          c.width = Math.max(1, Math.round(img.naturalWidth * scale));
          c.height = Math.max(1, Math.round(img.naturalHeight * scale));
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          var mime = fmtEl.value || "image/webp";
          c.toBlob(function (blob) {
            if (!blob) { done(); return; }
            var durl = URL.createObjectURL(blob);
            var ext = mime === "image/jpeg" ? "jpg" : "webp";
            var name = file.name.replace(/\.[^.]+$/, "") + "-compressed." + ext;
            results.push({ name: name, url: durl, orig: file.size, comp: blob.size, w: c.width });
            var fig = document.createElement("figure");
            var im = document.createElement("img");
            im.src = durl; im.alt = name; im.loading = "lazy";
            var cap = document.createElement("figcaption");
            var saved = Math.max(0, Math.round((1 - blob.size / file.size) * 100));
            cap.textContent = name + " · " + kb(file.size) + " → " + kb(blob.size) + " (−" + saved + "%)";
            var dl = document.createElement("a");
            dl.href = durl; dl.download = name; dl.className = "ao-mini-dl"; dl.textContent = "Download";
            fig.appendChild(im); fig.appendChild(cap); fig.appendChild(dl);
            row.appendChild(fig);
            done();
          }, mime, quality());
          function done() {
            URL.revokeObjectURL(url);
            if (--pending === 0) {
              var to = results.reduce(function (s, r) { return s + r.orig; }, 0);
              var tc2 = results.reduce(function (s, r) { return s + r.comp; }, 0);
              var sv = to ? Math.round((1 - tc2 / to) * 100) : 0;
              out.textContent = results.length + " compressed: " + kb(to) + " → " + kb(tc2) + " (−" + sv + "%). Downloads are yours to keep.";
              htmlBtn.hidden = !results.length;
            }
          }
        };
        img.onerror = function () { URL.revokeObjectURL(url); if (--pending === 0) paint(); };
        img.src = url;
      });
      function paint() { out.textContent = results.length ? out.textContent : "Could not read those files."; }
    });
    htmlBtn.addEventListener("click", function () {
      var html = results.map(function (r) {
        return '<img src="/images/' + r.name + '" width="' + r.w + '" loading="lazy" alt="">';
      }).join("\n");
      copyText(html, out, "srcset HTML copied — images go to /images/ on delivery.");
    });
    aoConfig("images", function () { return results.length + " compressed this visit."; });
  }

  function bindSpeed(root) {
    var items = Array.prototype.slice.call(root.querySelectorAll("[data-sp-list] li"));
    var out = root.querySelector("[data-sp-out]");
    var btn = root.querySelector("[data-sp-run]");
    var reportEl = root.querySelector("[data-sp-report]");
    var copyBtn = root.querySelector("[data-sp-copy]");
    var lastReport = "";
    btn.addEventListener("click", function () {
      btn.disabled = true;
      out.textContent = "Auditing this page…";
      reportEl.hidden = true;
      copyBtn.hidden = true;
      items.forEach(function (li) { li.classList.remove("is-on"); });
      var i = 0;
      var step = setInterval(function () {
        if (i < items.length) { items[i].classList.add("is-on"); i++; return; }
        clearInterval(step);
        btn.disabled = false;
        // Qualitative read-out only — no raw timings, byte counts, or config internals.
        var imgs = Array.prototype.slice.call(document.images || []);
        var noLazy = imgs.filter(function (im) { return im.loading !== "lazy" && im.getBoundingClientRect().top > window.innerHeight; }).length;
        var preconnect = !!document.querySelector('link[rel="preconnect"]');
        var feel = noLazy === 0 ? "Fast" : "Needs work";
        var lines = [
          "CabsCode Speed Pass — this page, your device",
          "Load feel: " + feel,
          "Images: " + (!imgs.length ? "no images on this page" : noLazy ? "needs attention" : "lazy-load OK"),
          "Fonts: " + (preconnect ? "preconnect present" : "handled in the pass"),
          "Caching + compression: handled in the pass",
          "Next: verify on PageSpeed after the pass",
        ];
        lastReport = lines.join("\n");
        reportEl.textContent = lastReport;
        reportEl.hidden = false;
        copyBtn.hidden = false;
        out.textContent = "Result: " + feel + " — full report above.";
      }, 300);
    });
    copyBtn.addEventListener("click", function () { copyText(lastReport, out, "Report copied — attach it to your Request this message."); });
    aoConfig("speed", function () { return lastReport ? "Speed read-out: " + lastReport.split("\n")[1] : "Audit not run yet"; });
  }

  function bindWhatsapp(root) {
    var numEl = root.querySelector("[data-wa-num]");
    var msgEl = root.querySelector("[data-wa-msg]");
    var labelEl = root.querySelector("[data-wa-label]");
    var btn = root.querySelector("[data-wa-btn]");
    var linkOut = root.querySelector("[data-wa-link]");
    var bubbleIn = root.querySelector("[data-wa-bubble-in]");
    function waLink() {
      var digits = (numEl.value || "").replace(/\D/g, "");
      var msg = msgEl.value || "";
      return "https://wa.me/" + (digits || "26770000000") + "?text=" + encodeURIComponent(msg);
    }
    function paint() {
      btn.href = waLink();
      btn.textContent = labelEl.value.trim() || "Chat on WhatsApp";
      bubbleIn.textContent = msgEl.value || "Hi!";
      linkOut.textContent = waLink();
    }
    [numEl, msgEl, labelEl].forEach(function (el) { el.addEventListener("input", paint); });
    root.querySelector("[data-wa-snippet]").addEventListener("click", function () {
      var snip = '<!-- WhatsApp add-on: floating click-to-chat -->\n<a class="wa-float" href="' + waLink() + '" target="_blank" rel="noopener">' +
        esc(labelEl.value.trim() || "Chat on WhatsApp") + '</a>\n<style>\n.wa-float{position:fixed;right:18px;bottom:18px;background:#1faa55;color:#fff;font-weight:700;border-radius:999px;padding:12px 22px;text-decoration:none;z-index:60}\n</style>';
      copyText(snip, linkOut, "Widget snippet copied — this is the exact code shipped in the P250 build.");
    });
    aoConfig("whatsapp", function () { return waLink() + " (" + (labelEl.value || "") + ")"; });
    paint();
  }

  function logoSvg(name, color, style) {
    var words = name.trim().split(/\s+/).filter(Boolean);
    var initials = words.map(function (w) { return w[0]; }).join("").slice(0, 2).toUpperCase() || "•";
    var mark = style === "word" ? "" : style === " Bolt" || style.trim() === "Bolt" ? "⚡" : initials;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">' +
      '<rect width="512" height="512" rx="112" fill="' + color + '"/>' +
      '<text x="256" y="330" font-family="Arial,Helvetica,sans-serif" font-size="220" font-weight="800" fill="#fff" text-anchor="middle">' +
      mark.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</text></svg>";
  }

  function bindLogo(root) {
    var nameEl = root.querySelector("[data-lg-name]");
    var colorEl = root.querySelector("[data-lg-color]");
    var styleEl = root.querySelector("[data-lg-style]");
    var out = root.querySelector("[data-lg-out]");
    function paint() {
      var name = nameEl.value.trim() || "Your Business";
      var color = colorEl.value || "#077d4a";
      var words = name.split(/\s+/).filter(Boolean);
      var initials = words.map(function (w) { return w[0]; }).join("").slice(0, 2).toUpperCase();
      var mark = styleEl.value.trim() === "Bolt" ? "⚡" : styleEl.value === "word" ? name.slice(0, 3).toUpperCase() : initials;
      [root.querySelector("[data-lg-mark]"), root.querySelector("[data-lg-fav]"), root.querySelector("[data-lg-ava]")].forEach(function (el) {
        if (el) { el.textContent = mark; el.style.background = color; }
      });
      var word = root.querySelector("[data-lg-word]");
      if (word) word.innerHTML = esc(name.toUpperCase());
    }
    [nameEl, colorEl, styleEl].forEach(function (el) { el.addEventListener("input", paint); el.addEventListener("change", paint); });
    function current() {
      return { name: nameEl.value.trim() || "Your Business", color: colorEl.value || "#077d4a", style: styleEl.value };
    }
    root.querySelector("[data-lg-svg]").addEventListener("click", function () {
      var c = current();
      download(c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-logo.svg", logoSvg(c.name, c.color, c.style), "image/svg+xml");
      out.textContent = "Downloaded logo.svg — starter mark, yours to keep.";
    });
    root.querySelector("[data-lg-png]").addEventListener("click", function () {
      var c = current();
      var img = new Image();
      img.onload = function () {
        var canvas = document.createElement("canvas");
        canvas.width = 180; canvas.height = 180;
        canvas.getContext("2d").drawImage(img, 0, 0, 180, 180);
        canvas.toBlob(function (blob) {
          if (!blob) return;
          downloadUrl(c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-favicon.png", URL.createObjectURL(blob));
          out.textContent = "Downloaded favicon.png (180px) — plus social avatar at the same mark.";
        }, "image/png");
      };
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(logoSvg(c.name, c.color, c.style));
    });
    root.querySelector("[data-lg-snippet]").addEventListener("click", function () {
      copyText('<link rel="icon" href="/images/favicon.png">\n<link rel="apple-touch-icon" href="/images/apple-touch-icon.png">\n<meta property="og:image" content="https://example.co.bw/images/favicon.png">', out, "Head snippet copied — wire the kit in /images/.");
    });
    aoConfig("logo", function () { var c = current(); return c.name + " · " + c.color + " · " + c.style; });
    paint();
  }

  function maintFallback(cost, tier) {
    var pct = Math.round(cost * 0.15);
    var price = Math.ceil(pct / 50) * 50;
    var cap = tier === "base" ? 250 : tier === "standard" ? 350 : 400;
    return { pct: pct, rounded: price, capped: Math.min(price, cap) };
  }

  function bindMaintenance(root) {
    var costEl = root.querySelector("[data-mn-cost]");
    var tierEl = root.querySelector("[data-mn-tier]");
    var out = root.querySelector("[data-mn-out]");
    function band() {
      var cost = num(costEl.value, 0);
      if (!cost) {
        out.textContent = "Enter your build to see your band.";
        return;
      }
      var tier = tierEl.value;
      var m;
      if (typeof maintenancePrice === "function") {
        m = maintenancePrice(tier === "ecommerce" ? 4000 : cost, tier === "ecommerce" ? "advanced" : tier);
      } else m = maintFallback(cost, tier).capped;
      out.textContent = "About P" + m.toLocaleString() + "/mo — exact figure in the estimator.";
    }
    costEl.addEventListener("input", band);
    tierEl.addEventListener("change", band);
    aoConfig("maintenance", function () {
      var cost = num(costEl.value, 0);
      return cost ? "Build P" + cost.toLocaleString() + " · tier " + tierEl.value : "No build entered yet";
    });
    band();
  }

  function bindSupport(root) {
    var range = root.querySelector("[data-su-range]");
    var n = root.querySelector("[data-su-n]");
    var out = root.querySelector("[data-su-out]");
    function band(h) {
      if (h <= 2) return "Small fix";
      if (h <= 6) return "Half-day block";
      return "Full-day+";
    }
    function paint() {
      var h = parseInt(range.value, 10);
      n.textContent = band(h);
      out.textContent = band(h) + " at P200/hour — exact total in the estimator.";
    }
    range.addEventListener("input", paint);
    aoConfig("support", function () { return "Effort: " + band(parseInt(range.value, 10)); });
    paint();
  }

  var BINDERS = {
    booking: bindBooking, gateway: bindGateway, momo: bindMomo, multilang: bindMultilang,
    domain: bindDomain, "google-business": bindGoogleBusiness, "seo-basic": bindSeoBasic, seo: bindSeoPack, blog: bindBlog,
    images: bindImages, speed: bindSpeed, whatsapp: bindWhatsapp, logo: bindLogo,
    maintenance: bindMaintenance, support: bindSupport,
  };

  /* ---------------- page build ---------------- */

  function init() {
    var sectionsEl = document.getElementById("aoSections");
    var railNav = document.getElementById("aoRailNav");
    var railCount = document.getElementById("aoRailCount");
    if (!sectionsEl || !railNav) return;

    var oneTime = typeof QUOTE_ADDONS !== "undefined" ? QUOTE_ADDONS : [];
    var monthly = typeof QUOTE_MONTHLY_ADDONS !== "undefined" ? QUOTE_MONTHLY_ADDONS : [];
    if (!oneTime.length && !monthly.length) {
      sectionsEl.innerHTML = '<p class="ao-err">Add-on data is unavailable right now — try the estimator instead.</p>';
      return;
    }

    var total = 0, sectionsHtml = "", railHtml = "";

    GROUPS.forEach(function (g, gi) {
      var items = [];
      g.items.forEach(function (id) {
        var a = byId(oneTime, id) || byId(monthly, id);
        if (a) items.push(a);
      });
      if (!items.length) return;
      total += items.length;
      var open = gi === 0;
      railHtml += '<div class="ao-acc' + (open ? " is-open" : "") + '" data-group="' + g.id + '">' +
        '<button type="button" class="ao-acc-toggle" aria-expanded="' + (open ? "true" : "false") + '">' +
        '<span class="ao-acc-left"><i data-lucide="' + g.icon + '"></i>' + esc(g.title) + "</span>" +
        '<span class="ao-acc-count">' + items.length + "</span></button>" +
        '<div class="ao-acc-panel">';
      items.forEach(function (a) {
        railHtml += '<a href="#addon-' + a.id + '">' + esc(a.label) + "</a>";
        sectionsHtml += sectionHtml(a, g);
      });
      railHtml += "</div></div>";
    });

    sectionsEl.innerHTML = sectionsHtml;
    railNav.innerHTML = railHtml;
    if (railCount) railCount.textContent = total + " real tools";
    if (window.lucide) lucide.createIcons();

    // Accordion toggles.
    railNav.querySelectorAll(".ao-acc-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var acc = btn.closest(".ao-acc");
        var willOpen = !acc.classList.contains("is-open");
        railNav.querySelectorAll(".ao-acc").forEach(function (x) {
          x.classList.remove("is-open");
          x.querySelector(".ao-acc-toggle").setAttribute("aria-expanded", "false");
        });
        if (willOpen) {
          acc.classList.add("is-open");
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });

    // Scrollspy with accordion sync — journal ToC pattern + group auto-open.
    var links = Array.prototype.slice.call(railNav.querySelectorAll("a"));
    var sections = Array.prototype.slice.call(sectionsEl.querySelectorAll(".ao-section"));
    if (links.length && sections.length && "IntersectionObserver" in window) {
      var byHref = {};
      links.forEach(function (l) { byHref[l.getAttribute("href")] = l; });
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (ent) {
            if (!ent.isIntersecting) return;
            var link = byHref["#" + ent.target.id];
            links.forEach(function (l) { l.classList.toggle("is-active", l === link); });
            if (link) {
              var acc = link.closest(".ao-acc");
              railNav.querySelectorAll(".ao-acc").forEach(function (x) {
                var on = x === acc;
                x.classList.toggle("is-open", on);
                x.querySelector(".ao-acc-toggle").setAttribute("aria-expanded", on ? "true" : "false");
              });
            }
          });
        },
        { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
      );
      sections.forEach(function (s) { io.observe(s); });
    }

    // Wire every real-tool widget + per-card estimator/request actions.
    sections.forEach(function (sec) {
      var id = sec.id.replace(/^addon-/, "");
      if (BINDERS[id]) {
        try { BINDERS[id](sec); } catch (e) { /* widget stays static */ }
      }
      try { wireCardActions(sec, id); } catch (e2) {}
    });

    // Mobile sheet toggle.
    var toggle = document.getElementById("aoSheetToggle");
    var rail = document.getElementById("aoRail");
    if (toggle && rail) {
      toggle.addEventListener("click", function () { rail.classList.toggle("is-open"); });
      rail.addEventListener("click", function (e) {
        if (e.target === rail) rail.classList.remove("is-open");
      });
      railNav.addEventListener("click", function (e) {
        if (e.target.closest("a")) rail.classList.remove("is-open");
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") rail.classList.remove("is-open");
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
