(function () {
  var $ = function (id) { return document.getElementById(id); };
  var editor = $("jaContent");

  /* ---------- Dropdowns ---------- */
  function closeAll(except) {
    document.querySelectorAll(".ja-dd").forEach(function (dd) {
      if (dd === except) return;
      var menu = dd.querySelector(".ja-dd-menu");
      var btn = dd.querySelector("button");
      if (menu) menu.hidden = true;
      if (btn) btn.setAttribute("aria-expanded", "false");
    });
  }

  // onPick(value, li, dd) fires for any menu item
  function wireDropdown(dd, onPick) {
    var btn = dd.querySelector("button");
    var menu = dd.querySelector(".ja-dd-menu");
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = menu.hidden;
      closeAll(dd);
      menu.hidden = !open;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    menu.addEventListener("click", function (e) {
      var li = e.target.closest("li");
      if (!li) return;
      menu.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      onPick(li.getAttribute("data-act") || li.getAttribute("data-value"), li, dd);
    });
  }
  document.addEventListener("click", function () { closeAll(null); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeAll(null); closeModal(); } });

  /* ---------- Category ---------- */
  var cat = $("jaCat"), newCat = $("jaNewCat");
  function setCategory(value, label) {
    cat.setAttribute("data-value", value);
    cat.querySelector(".ja-dd-label").textContent = label;
    cat.querySelectorAll("li").forEach(function (li) {
      li.setAttribute("aria-selected", li.getAttribute("data-value") === value ? "true" : "false");
    });
    newCat.hidden = value !== "__new";
    if (value === "__new") newCat.focus();
  }
  wireDropdown(cat, function (value, li) { setCategory(value, li.textContent); });
  setCategory("Personal Projects", "Personal Projects");

  /* ---------- Editor helpers ---------- */
  function sel() { return { s: editor.selectionStart, e: editor.selectionEnd, v: editor.value }; }
  function put(text, selStart, selEnd) {
    var x = sel();
    editor.value = x.v.slice(0, x.s) + text + x.v.slice(x.e);
    editor.focus();
    var base = x.s;
    editor.setSelectionRange(base + (selStart != null ? selStart : text.length), base + (selEnd != null ? selEnd : text.length));
    editor.dispatchEvent(new Event("input"));
  }
  function wrap(before, after, placeholder) {
    var x = sel();
    var chosen = x.v.slice(x.s, x.e) || placeholder;
    put(before + chosen + after, before.length, before.length + chosen.length);
  }
  // prefix every selected line (or insert a new line when nothing selected)
  function linePrefix(fn, placeholder) {
    var x = sel();
    var start = x.v.lastIndexOf("\n", x.s - 1) + 1;
    var endIdx = x.v.indexOf("\n", x.e);
    if (endIdx === -1) endIdx = x.v.length;
    var block = x.v.slice(start, endIdx) || placeholder;
    var out = block.split("\n").map(fn).join("\n");
    editor.value = x.v.slice(0, start) + out + x.v.slice(endIdx);
    editor.focus();
    editor.setSelectionRange(start, start + out.length);
    editor.dispatchEvent(new Event("input"));
  }
  function blockSpacing(text) {
    var x = sel();
    var pre = x.s === 0 || /\n\n$/.test(x.v.slice(0, x.s)) ? "" : /\n$/.test(x.v.slice(0, x.s)) ? "\n" : "\n\n";
    put(pre + text + "\n\n");
  }

  /* ---------- Insert dialog ---------- */
  var modal = $("jaModal"), mTitle = $("jaModalTitle"), mFields = $("jaModalFields"), mOk = $("jaModalOk");
  var onOk = null;
  var LANGS = ["JavaScript", "TypeScript", "HTML", "CSS", "JSON", "Bash", "Python", "SQL", "Docker", "Plain text"];
  var LANG_ID = { "JavaScript": "javascript", "TypeScript": "typescript", "HTML": "html", "CSS": "css", "JSON": "json", "Bash": "bash", "Python": "python", "SQL": "sql", "Docker": "docker", "Plain text": "" };

  function field(labelText, node) {
    var wrapEl = document.createElement("div");
    wrapEl.className = "ja-field";
    var l = document.createElement("label");
    l.textContent = labelText;
    wrapEl.appendChild(l);
    wrapEl.appendChild(node);
    mFields.appendChild(wrapEl);
    return node;
  }
  function input(placeholder) {
    var i = document.createElement("input");
    i.className = "ja-input";
    i.placeholder = placeholder || "";
    return i;
  }
  function openModal(title, okLabel, build, done) {
    mTitle.textContent = title;
    mOk.textContent = okLabel;
    mFields.innerHTML = "";
    var first = build();
    onOk = done;
    modal.hidden = false;
    if (first) first.focus();
  }
  function closeModal() { modal.hidden = true; onOk = null; }
  $("jaModalCancel").addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
  mOk.addEventListener("click", function () { if (onOk && onOk() !== false) closeModal(); });

  function langDropdown() {
    var dd = document.createElement("div");
    dd.className = "ja-dd";
    dd.setAttribute("data-value", "JavaScript");
    dd.innerHTML = '<button type="button" class="ja-dd-btn" aria-haspopup="listbox" aria-expanded="false"><span class="ja-dd-label">JavaScript</span></button><ul class="ja-dd-menu" role="listbox" hidden></ul>';
    var ul = dd.querySelector("ul");
    LANGS.forEach(function (n) {
      var li = document.createElement("li");
      li.setAttribute("role", "option");
      li.setAttribute("data-value", n);
      li.textContent = n;
      ul.appendChild(li);
    });
    wireDropdown(dd, function (v) {
      dd.setAttribute("data-value", v);
      dd.querySelector(".ja-dd-label").textContent = v;
    });
    return dd;
  }

  function insertCode() {
    var dd, ta;
    openModal("Insert code block", "Insert", function () {
      dd = field("Language", langDropdown());
      ta = document.createElement("textarea");
      ta.className = "ja-input";
      ta.placeholder = "Paste or type your code…";
      field("Code", ta);
      var x = sel(); ta.value = x.v.slice(x.s, x.e);
      return ta;
    }, function () {
      var code = ta.value.replace(/\s+$/, "");
      if (!code) { ta.focus(); return false; }
      var lang = LANG_ID[dd.getAttribute("data-value")] || "";
      blockSpacing("```" + lang + "\n" + code + "\n```");
    });
  }
  function insertLink() {
    var text, url;
    openModal("Insert link", "Insert", function () {
      text = field("Link text", input("What readers see"));
      var x = sel(); text.value = x.v.slice(x.s, x.e);
      url = field("Address", input("https://…"));
      return text.value ? url : text;
    }, function () {
      if (!url.value.trim()) { url.focus(); return false; }
      put("[" + (text.value.trim() || url.value.trim()) + "](" + url.value.trim() + ")");
    });
  }
  function insertImage() {
    var url, alt;
    openModal("Insert image", "Insert", function () {
      url = field("Image address", input("https://… or /images/…"));
      alt = field("Description (alt text)", input("Short description"));
      return url;
    }, function () {
      if (!url.value.trim()) { url.focus(); return false; }
      blockSpacing("![" + alt.value.trim() + "](" + url.value.trim() + ")");
    });
  }

  /* ---------- Toolbar ---------- */
  var ACTIONS = {
    h1: function () { linePrefix(function (l) { return "# " + l.replace(/^#+\s*/, ""); }, "Section heading"); },
    h2: function () { linePrefix(function (l) { return "## " + l.replace(/^#+\s*/, ""); }, "Sub-heading"); },
    h3: function () { linePrefix(function (l) { return "### " + l.replace(/^#+\s*/, ""); }, "Small heading"); },
    bold: function () { wrap("**", "**", "bold text"); },
    italic: function () { wrap("*", "*", "italic text"); },
    inline: function () { wrap("`", "`", "code"); },
    ul: function () { linePrefix(function (l) { return "- " + l; }, "List item"); },
    ol: function () { var n = 0; linePrefix(function (l) { n++; return n + ". " + l; }, "List item"); },
    quote: function () { linePrefix(function (l) { return "> " + l; }, "Quote"); },
    divider: function () { blockSpacing("---"); },
    code: insertCode,
    link: insertLink,
    image: insertImage
  };
  function run(act) { if (ACTIONS[act]) ACTIONS[act](); }

  document.querySelectorAll("#jaToolbar .ja-dd-tool").forEach(function (dd) { wireDropdown(dd, run); });
  document.querySelectorAll("#jaToolbar > .ja-tool[data-act]").forEach(function (b) {
    b.addEventListener("click", function () { run(b.getAttribute("data-act")); });
  });

  // Keyboard shortcuts
  editor.addEventListener("keydown", function (e) {
    if (!(e.ctrlKey || e.metaKey)) return;
    var k = e.key.toLowerCase();
    if (k === "b") { e.preventDefault(); run("bold"); }
    else if (k === "i") { e.preventDefault(); run("italic"); }
    else if (k === "k") { e.preventDefault(); run("link"); }
  });

  /* ---------- Preview toggle ---------- */
  var prev = $("jaPreview"), prevBtn = $("jaPreviewToggle");
  prevBtn.addEventListener("click", function () {
    var on = prevBtn.getAttribute("aria-pressed") !== "true";
    prevBtn.setAttribute("aria-pressed", on ? "true" : "false");
    prevBtn.textContent = on ? "Edit" : "Preview";
    if (on) prev.innerHTML = CcMarkdown.render(editor.value) || "<p>Nothing to preview yet.</p>";
    prev.hidden = !on;
    editor.hidden = on;
    document.querySelectorAll("#jaToolbar .ja-tool:not(#jaPreviewToggle)").forEach(function (b) { b.disabled = on; });
  });

  /* ---------- Publish ---------- */
  var pw = $("jaPassword"), btn = $("jaPublish"), status = $("jaStatus");
  function syncBtn() { btn.disabled = !pw.value.trim(); }
  pw.addEventListener("input", syncBtn);

  $("jaForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!pw.value.trim()) return;
    var value = cat.getAttribute("data-value");
    var category = value === "__new" ? newCat.value.trim() : value;
    btn.disabled = true;
    status.className = "ja-status";
    status.textContent = "Publishing…";
    try {
      var res = await fetch("/api/journal/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: $("jaTitle").value,
          category: category,
          tags: $("jaTags").value,
          slug: $("jaSlug").value,
          excerpt: $("jaExcerpt").value,
          content: editor.value,
          password: pw.value
        })
      });
      var data = await res.json().catch(function () { return {}; });
      if (res.ok) {
        status.className = "ja-status ok";
        status.textContent = "Published. ";
        var a = document.createElement("a");
        a.href = data.href;
        a.textContent = "Open the post →";
        status.appendChild(a);
        ["jaTitle", "jaTags", "jaSlug", "jaExcerpt", "jaContent"].forEach(function (id) { $(id).value = ""; });
        pw.value = "";
      } else {
        status.className = "ja-status err";
        status.textContent = data.error || "Publish failed (" + res.status + ").";
      }
    } catch (_) {
      status.className = "ja-status err";
      status.textContent = "Could not reach the server.";
    }
    syncBtn();
  });
})();
