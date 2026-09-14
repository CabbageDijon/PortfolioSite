// webtools/qr.js — QR Code Generator (migrated from script.js).
// Loaded on studio.html; exposes global initQRTool(card).
// Depends on QRCodeStyling UMD (unpkg) with legacy canvas fallback.

// --- QR Code Generator (styled: WiFi/vCard/message/location/event + logo) ---
var QR_TYPE_LABELS = {
  text: "Link / Text",
  wifi: "WiFi sign-in",
  vcard: "Contact (vCard)",
  email: "Email",
  sms: "SMS",
  phone: "Phone call",
  whatsapp: "WhatsApp",
  location: "Location",
  event: "Calendar event",
};

function qrEscapeWifi(s) {
  return String(s || "").replace(/([\\;,:"'])/g, "\\$1");
}

function qrToQrDateTime(local) {
  // datetime-local "2026-09-14T10:00" -> "20260914T100000" (floating time)
  var d = String(local || "").replace(/[-:]/g, "");
  if (/^\d{8}T\d{4}$/.test(d)) return d + "00";
  return d;
}

function initQRTool(card) {
  if (card.qrInitialized) return;
  card.qrInitialized = true;

  var $ = function (sel) { return card.querySelector(sel); };
  var tabs = card.querySelectorAll(".qr-tab");
  var panes = card.querySelectorAll(".qr-pane");
  var summary = $("#qr-mode-summary");
  var errBox = $("#qr-error");
  var metaBox = $("#qr-meta");
  var encodedBox = $("#qr-encoded");
  var container = $("#qr-code");
  var libWarning = $("#qr-lib-warning");
  var sizeSelect = $("#qr-size");
  var dotSelect = $("#qr-dot-type");
  var cornerSq = $("#qr-corner-sq");
  var cornerDot = $("#qr-corner-dot");
  var marginSelect = $("#qr-margin");
  var fgInput = $("#qr-fg");
  var bgInput = $("#qr-bg");
  var logoInput = $("#qr-logo");
  var logoSize = $("#qr-logo-size");
  var logoSizeVal = $("#qr-logo-size-val");
  var logoClear = $("#qr-logo-clear");
  var downloadBtn = $("#qr-download");
  var downloadSvgBtn = $("#qr-download-svg");
  var copyBtn = $("#qr-copy");
  var wifiAuth = $("#qr-wifi-auth");
  var wifiPass = $("#qr-wifi-pass");

  var state = { type: "text", logoURL: null, logoDataUrl: null };
  var qr = null;
  var styledOK = typeof window.QRCodeStyling !== "undefined";
  var legacyQR = null;
  var debounce = null;

  if (!styledOK && libWarning) libWarning.hidden = false;

  function val(id) {
    var el = $(id);
    return el ? String(el.value || "").trim() : "";
  }

  function setError(msg) {
    if (!errBox) return;
    if (!msg) { errBox.hidden = true; errBox.textContent = ""; return; }
    errBox.hidden = false;
    errBox.textContent = msg;
  }

  function buildPayload() {
    var t = state.type;
    if (t === "wifi") {
      var ssid = val("#qr-wifi-ssid");
      var auth = wifiAuth ? wifiAuth.value : "WPA";
      var pass = val("#qr-wifi-pass");
      var hidden = $("#qr-wifi-hidden") && $("#qr-wifi-hidden").checked;
      if (!ssid) return { error: "Enter the WiFi network name (SSID).", data: null };
      if (auth !== "nopass" && !pass) return { error: "Enter the WiFi password (or choose Open).", data: null };
      if (auth !== "nopass" && pass.length < 8 && auth === "WPA") return { error: "WPA passwords need at least 8 characters.", data: null };
      var payload = "WIFI:T:" + auth + ";S:" + qrEscapeWifi(ssid) + ";";
      if (auth !== "nopass") payload += "P:" + qrEscapeWifi(pass) + ";";
      if (hidden) payload += "H:true;";
      return { error: null, data: payload + ";" };
    }
    if (t === "vcard") {
      var first = val("#qr-vc-first"), last = val("#qr-vc-last");
      var phone = val("#qr-vc-phone"), email = val("#qr-vc-email");
      var org = val("#qr-vc-org"), url = val("#qr-vc-url");
      if (!first && !last && !phone && !email) return { error: "Enter at least a name, phone or email for the contact.", data: null };
      if (email && !/.+@.+\..+/.test(email)) return { error: "That contact email looks invalid.", data: null };
      var lines = ["BEGIN:VCARD", "VERSION:3.0", "N:" + last + ";" + first + ";;;", "FN:" + [first, last].filter(Boolean).join(" ")];
      if (phone) lines.push("TEL;TYPE=CELL:" + phone);
      if (email) lines.push("EMAIL:" + email);
      if (org) lines.push("ORG:" + org);
      if (url) lines.push("URL:" + url);
      lines.push("END:VCARD");
      return { error: null, data: lines.join("\n") };
    }
    if (t === "email") {
      var to = val("#qr-em-to");
      if (!to) return { error: "Enter the recipient email address.", data: null };
      if (!/.+@.+\..+/.test(to)) return { error: "That recipient email looks invalid.", data: null };
      var q = [];
      if (val("#qr-em-subject")) q.push("subject=" + encodeURIComponent(val("#qr-em-subject")));
      if (val("#qr-em-body")) q.push("body=" + encodeURIComponent(val("#qr-em-body")));
      return { error: null, data: "mailto:" + to + (q.length ? "?" + q.join("&") : "") };
    }
    if (t === "sms") {
      var num = val("#qr-sms-num").replace(/[\s\-()]/g, "");
      if (!num) return { error: "Enter the SMS phone number.", data: null };
      if (!/^\+?\d{6,15}$/.test(num)) return { error: "Enter a valid phone number (6–15 digits).", data: null };
      var msg = val("#qr-sms-msg");
      return { error: null, data: msg ? "SMSTO:" + num + ":" + msg : "SMSTO:" + num };
    }
    if (t === "phone") {
      var tel = val("#qr-tel-num").replace(/[\s\-()]/g, "");
      if (!tel) return { error: "Enter the phone number to call.", data: null };
      if (!/^\+?\d{6,15}$/.test(tel)) return { error: "Enter a valid phone number (6–15 digits).", data: null };
      return { error: null, data: "tel:" + tel };
    }
    if (t === "whatsapp") {
      var wa = val("#qr-wa-num").replace(/[^\d]/g, "");
      if (!wa) return { error: "Enter the WhatsApp number with country code (digits only).", data: null };
      if (!/^\d{6,15}$/.test(wa)) return { error: "WhatsApp numbers need 6–15 digits including country code.", data: null };
      var wmsg = val("#qr-wa-msg");
      return { error: null, data: wmsg ? "https://wa.me/" + wa + "?text=" + encodeURIComponent(wmsg) : "https://wa.me/" + wa };
    }
    if (t === "location") {
      var lat = parseFloat(val("#qr-geo-lat")), lng = parseFloat(val("#qr-geo-lng"));
      if (isNaN(lat) || lat < -90 || lat > 90) return { error: "Latitude must be between -90 and 90.", data: null };
      if (isNaN(lng) || lng < -180 || lng > 180) return { error: "Longitude must be between -180 and 180.", data: null };
      var label = val("#qr-geo-label");
      return { error: null, data: label ? "geo:" + lat + "," + lng + "?q=" + encodeURIComponent(label) : "geo:" + lat + "," + lng };
    }
    if (t === "event") {
      var title = val("#qr-ev-title");
      var start = $("#qr-ev-start") ? $("#qr-ev-start").value : "";
      if (!title) return { error: "Enter the event title.", data: null };
      if (!start) return { error: "Pick the event start date/time.", data: null };
      var end = $("#qr-ev-end") ? $("#qr-ev-end").value : "";
      if (end && end < start) return { error: "Event end must be after the start.", data: null };
      var ev = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", "SUMMARY:" + title, "DTSTART:" + qrToQrDateTime(start)];
      if (end) ev.push("DTEND:" + qrToQrDateTime(end));
      if (val("#qr-ev-loc")) ev.push("LOCATION:" + val("#qr-ev-loc"));
      if (val("#qr-ev-desc")) ev.push("DESCRIPTION:" + val("#qr-ev-desc"));
      ev.push("END:VEVENT", "END:VCALENDAR");
      return { error: null, data: ev.join("\n") };
    }
    var text = ($("#qr-input") ? $("#qr-input").value : "").trim() || "https://cabscode.pro";
    return { error: null, data: text };
  }

  function styleOptions() {
    var fg = fgInput ? fgInput.value : "#1a1a1a";
    var bg = bgInput ? bgInput.value : "#ffffff";
    return { fg: fg, bg: bg };
  }

  function lowContrastWarn(fg, bg) {
    function lum(hex) {
      var c = hex.replace("#", "");
      if (c.length === 3) c = c.split("").map(function (x) { return x + x; }).join("");
      var r = parseInt(c.slice(0, 2), 16) / 255, g = parseInt(c.slice(2, 4), 16) / 255, b = parseInt(c.slice(4, 6), 16) / 255;
      function ch(v) { return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
      return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
    }
    try {
      var L1 = lum(fg), L2 = lum(bg);
      var ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      return ratio < 3;
    } catch (e) { return false; }
  }

  function currentStyle() {
    var st = styleOptions();
    var hasLogo = !!(state.logoURL || state.logoDataUrl);
    var opts = {
      width: 300,
      height: 300,
      type: "canvas",
      qrOptions: { errorCorrectionLevel: hasLogo ? "H" : "Q", mode: "Byte" },
      dotsOptions: { color: st.fg, type: dotSelect ? dotSelect.value : "square" },
      cornersSquareOptions: { color: st.fg, type: (cornerSq && cornerSq.value) || undefined },
      cornersDotOptions: { color: st.fg, type: (cornerDot && cornerDot.value) || undefined },
      backgroundOptions: { color: st.bg },
      imageOptions: { crossOrigin: "anonymous", margin: 8, hideBackgroundDots: true, imageSize: logoSize ? (parseInt(logoSize.value, 10) / 100) : 0.2 },
    };
    if (hasLogo) opts.image = state.logoURL || state.logoDataUrl;
    return opts;
  }

  function renderStyled(data) {
    var opts = currentStyle();
    opts.data = data;
    if (!qr) {
      qr = new QRCodeStyling(opts);
      container.innerHTML = "";
      qr.append(container);
    } else {
      qr.update(opts);
    }
  }

  function renderLegacy(data) {
    // Fallback when the styling CDN is blocked
    if (typeof window.QRCode !== "undefined" && window.QRCode.CorrectLevel) {
      container.innerHTML = "";
      legacyQR = new QRCode(container, {
        text: data, width: 256, height: 256,
        colorDark: "#1a1a1a", colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M,
      });
    } else {
      container.innerHTML = '<p class="qr-hint">QR library unavailable offline. Reconnect to load the generator.</p>';
    }
  }

  function scheduleRender() {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(render, 220);
  }

  function render() {
    var built = buildPayload();
    if (built.error || !built.data) {
      setError(built.error || "Enter the highlighted details.");
      if (metaBox) metaBox.textContent = "";
      if (encodedBox) encodedBox.textContent = "";
      return;
    }
    setError(null);
    var st = styleOptions();
    if (lowContrastWarn(st.fg, st.bg) && metaBox) {
      metaBox.textContent = "Low contrast (" + st.fg + " on " + st.bg + ") — may not scan. " + built.data.length + " chars · " + QR_TYPE_LABELS[state.type] + (state.logoURL || state.logoDataUrl ? " · logo on (ECC-H)" : " · ECC-Q");
    } else if (metaBox) {
      metaBox.textContent = built.data.length + " chars · " + QR_TYPE_LABELS[state.type] + (state.logoURL || state.logoDataUrl ? " · logo on (ECC-H)" : " · ECC-Q");
    }
    if (encodedBox) {
      encodedBox.textContent = built.data.length > 220 ? built.data.slice(0, 220) + "…" : built.data;
      encodedBox.title = built.data;
    }
    try {
      if (styledOK) renderStyled(built.data);
      else renderLegacy(built.data);
    } catch (e) {
      renderLegacy(built.data);
    }
  }

  function setType(t) {
    state.type = t;
    tabs.forEach(function (b) {
      var on = b.getAttribute("data-qr-type") === t;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    panes.forEach(function (p) {
      p.classList.toggle("is-active", p.getAttribute("data-pane") === t);
    });
    if (summary) summary.textContent = QR_TYPE_LABELS[t] || t;
    render();
  }

  tabs.forEach(function (b) {
    b.addEventListener("click", function () { setType(b.getAttribute("data-qr-type")); });
  });

  card.querySelectorAll("input, select, textarea").forEach(function (el) {
    if (el.id === "qr-logo" || el.id === "qr-logo-size") return;
    el.addEventListener("input", scheduleRender);
    el.addEventListener("change", scheduleRender);
  });
  if (wifiAuth) wifiAuth.addEventListener("change", function () {
    if (wifiPass) wifiPass.disabled = wifiAuth.value === "nopass";
    scheduleRender();
  });
  if (wifiPass && wifiAuth && wifiAuth.value === "nopass") wifiPass.disabled = true;

  function fileToDataUrl(file) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(r.result); };
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  if (logoInput) {
    logoInput.addEventListener("change", function () {
      var f = logoInput.files && logoInput.files[0];
      if (!f) return;
      if (f.size > 2 * 1024 * 1024) { setError("Logo must be under 2MB."); logoInput.value = ""; return; }
      if (state.logoURL) { try { URL.revokeObjectURL(state.logoURL); } catch (e) {} }
      state.logoURL = URL.createObjectURL(f);
      state.logoDataUrl = null;
      if (f.type === "image/svg+xml") {
        fileToDataUrl(f).then(function (d) { state.logoDataUrl = d; render(); }).catch(function () { render(); });
      }
      render();
    });
  }
  if (logoSize) {
    logoSize.addEventListener("input", function () {
      if (logoSizeVal) logoSizeVal.textContent = logoSize.value + "%";
      scheduleRender();
    });
  }
  if (logoClear) {
    logoClear.addEventListener("click", function () {
      if (state.logoURL) { try { URL.revokeObjectURL(state.logoURL); } catch (e) {} }
      state.logoURL = null;
      state.logoDataUrl = null;
      if (logoInput) logoInput.value = "";
      render();
    });
  }

  function exportFile(ext) {
    var built = buildPayload();
    if (built.error || !built.data) { setError(built.error || "Fix the form first."); return; }
    if (!styledOK || !qr) {
      var canvas = container.querySelector("canvas");
      if (canvas) {
        var link = document.createElement("a");
        link.download = "qrcode.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
      return;
    }
    var size = sizeSelect ? parseInt(sizeSelect.value, 10) : 1024;
    var opts = currentStyle();
    opts.width = size;
    opts.height = size;
    opts.data = built.data;
    var off = new QRCodeStyling(opts);
    off.download({ name: "qrcode-" + state.type, extension: ext }).catch(function () {
      setError("Export failed — try PNG instead of SVG with this logo.");
    });
  }

  if (downloadBtn) downloadBtn.addEventListener("click", function () { exportFile("png"); });
  if (downloadSvgBtn) downloadSvgBtn.addEventListener("click", function () { exportFile("svg"); });
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var built = buildPayload();
      if (built.error || !built.data) { setError(built.error || "Fix the form first."); return; }
      if (styledOK && qr && qr.getRawData) {
        qr.getRawData("png").then(function (blob) {
          if (!blob) throw new Error("empty");
          var item = new ClipboardItem({ "image/png": blob });
          return navigator.clipboard.write([item]);
        }).then(function () {
          copyBtn.textContent = "Copied!";
          setTimeout(function () { copyBtn.textContent = "Copy"; }, 1600);
        }).catch(function () {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(built.data).then(function () {
              copyBtn.textContent = "Text copied!";
              setTimeout(function () { copyBtn.textContent = "Copy"; }, 1600);
            });
          }
        });
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(built.data);
      }
    });
  }

  setType("text");
}
