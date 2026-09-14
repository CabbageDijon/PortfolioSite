// webtools/regex.js — Regex Tester with live highlight, groups & replace.
// Exposes global initRegexTool(card). Uses native RegExp only.

var RX_SAMPLES = {
  email: {
    pattern: "[\\w.+-]+@[\\w-]+\\.[\\w.]+",
    flags: "gi",
    text: "Contact us at services@cabscode.pro or tema.bown+work@example.co.bw for quotes.",
  },
  phone: {
    pattern: "\\+267\\s?7\\d{2}\\s?\\d{3}\\s?\\d{3}",
    flags: "g",
    text: "Call +267 712 345 678 or +267712345678 — WhatsApp works on both.",
  },
  url: {
    pattern: "https?://[^\\s)\"']+",
    flags: "gi",
    text: "See https://cabscode.pro/studio and http://localhost:8081/notes for the new tools.",
  },
};

function rxEscapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function initRegexTool(card) {
  if (card.rxInitialized) return;
  card.rxInitialized = true;

  var $ = function (sel) { return card.querySelector(sel); };
  var patternEl = $("#rx-pattern");
  var textEl = $("#rx-text");
  var replaceEl = $("#rx-replace");
  var outEl = $("#rx-output");
  var groupsEl = $("#rx-groups");
  var metaEl = $("#rx-meta");
  var errBox = $("#rx-error");
  var t = null;

  function flags() {
    var f = "";
    ["g", "m", "i", "s", "u", "y"].forEach(function (fl) {
      var cb = card.querySelector('[data-rx-flag="' + fl + '"]');
      if (cb && cb.checked) f += fl;
    });
    return f;
  }

  function setError(msg) {
    if (!errBox) return;
    if (!msg) { errBox.hidden = true; errBox.textContent = ""; return; }
    errBox.hidden = false;
    errBox.textContent = msg;
  }

  function render() {
    var src = patternEl ? patternEl.value : "";
    var text = textEl ? textEl.value : "";
    if (!src) {
      setError(null);
      if (outEl) outEl.innerHTML = '<span class="tool-hint">Type a pattern above — matches light up here.</span>';
      if (groupsEl) groupsEl.innerHTML = "";
      if (metaEl) metaEl.textContent = "";
      return;
    }
    var fl = flags();
    var re;
    try {
      re = new RegExp(src, fl);
    } catch (e) {
      setError("Invalid pattern: " + e.message);
      return;
    }
    setError(null);
    var t0 = performance.now();
    var matches = [];
    var wantAll = fl.indexOf("g") !== -1 || fl.indexOf("y") !== -1;
    try {
      if (wantAll) {
        re.lastIndex = 0;
        var m, guard = 0;
        while ((m = re.exec(text)) !== null && guard < 5000) {
          guard++;
          matches.push({ index: m.index, match: m[0], groups: Array.prototype.slice.call(m, 1) });
          if (m[0].length === 0) re.lastIndex++; // avoid empty-match loop
          if (performance.now() - t0 > 500) break;
        }
      } else {
        var s = re.exec(text);
        if (s) matches.push({ index: s.index, match: s[0], groups: Array.prototype.slice.call(s, 1) });
      }
    } catch (e) {
      setError("Match failed: " + e.message);
      return;
    }
    var ms = Math.round((performance.now() - t0) * 10) / 10;

    // Highlighted output (escape first, then splice marks)
    if (outEl) {
      if (!matches.length) {
        outEl.textContent = text || "No input text yet.";
      } else {
        var html = "", pos = 0;
        matches.forEach(function (mm, i) {
          html += rxEscapeHtml(text.slice(pos, mm.index));
          html += '<mark data-n="' + (i + 1) + '">' + (rxEscapeHtml(mm.match) || "&#8203;") + "</mark>";
          pos = mm.index + mm.match.length;
        });
        html += rxEscapeHtml(text.slice(pos));
        outEl.innerHTML = html;
      }
    }

    // Groups table
    if (groupsEl) {
      if (!matches.length) {
        groupsEl.innerHTML = "";
      } else {
        groupsEl.innerHTML = matches.map(function (mm, i) {
          var cells = '<td>#' + (i + 1) + " @" + mm.index + "</td><td>" + rxEscapeHtml(mm.match) + "</td>";
          if (mm.groups.length) {
            cells += "<td>" + mm.groups.map(function (g, gi) {
              return "$" + (gi + 1) + "=" + (g === undefined ? "—" : rxEscapeHtml(g));
            }).join(" ") + "</td>";
          } else {
            cells += "<td>—</td>";
          }
          return "<tr>" + cells + "</tr>";
        }).join("");
      }
    }

    // Replace preview
    var repOut = $("#rx-replace-out");
    if (repOut) {
      var rep = replaceEl ? replaceEl.value : "";
      if (rep) {
        try {
          re.lastIndex = 0;
          repOut.textContent = text.replace(re, rep);
        } catch (e) {
          repOut.textContent = "Replace failed: " + e.message;
        }
      } else {
        repOut.textContent = "";
      }
    }

    if (metaEl) {
      metaEl.textContent = matches.length + (matches.length === 1 ? " match" : " matches") +
        " · /" + src + "/" + (fl || "(no flags)") + " · " + ms + "ms" +
        (ms > 500 ? " — slow pattern, consider simplifying" : "");
    }
  }

  function schedule() {
    if (t) clearTimeout(t);
    t = setTimeout(render, 180);
  }

  [patternEl, textEl, replaceEl].forEach(function (el) {
    if (el) { el.addEventListener("input", schedule); }
  });
  card.querySelectorAll("[data-rx-flag]").forEach(function (cb) {
    cb.addEventListener("change", render);
  });

  card.querySelectorAll("[data-rx-sample]").forEach(function (b) {
    b.addEventListener("click", function () {
      var s = RX_SAMPLES[b.getAttribute("data-rx-sample")];
      if (!s) return;
      if (patternEl) patternEl.value = s.pattern;
      if (textEl) textEl.value = s.text;
      card.querySelectorAll("[data-rx-flag]").forEach(function (cb) {
        cb.checked = s.flags.indexOf(cb.getAttribute("data-rx-flag")) !== -1;
      });
      render();
    });
  });

  var copyBtn = $("#rx-copy");
  if (copyBtn) copyBtn.addEventListener("click", function () {
    var repOut = $("#rx-replace-out");
    var txt = repOut && repOut.textContent ? repOut.textContent : (outEl ? outEl.textContent : "");
    if (txt && navigator.clipboard) {
      navigator.clipboard.writeText(txt).then(function () {
        copyBtn.textContent = "Copied!";
        setTimeout(function () { copyBtn.textContent = "Copy result"; }, 1600);
      });
    }
  });

  render();
}
