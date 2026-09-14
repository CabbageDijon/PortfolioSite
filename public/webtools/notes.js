// webtools/notes.js — Markdown notes (localStorage, zero deps).
// Shared by the Studio card (initNotesTool) and /notes page (initNotesPage).
// Exposes: renderMarkdown, initNotesTool, initNotesPage.

var NOTES_KEY = "cc-notes-v1";

function mdEscape(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function mdInline(s) {
  var codes = [];
  s = String(s).replace(/`([^`]+?)`/g, function (m, g) {
    codes.push(g);
    return "\x00CODE" + (codes.length - 1) + "\x00";
  });
  s = mdEscape(s);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, '<img src="$2" alt="$1" loading="lazy" />');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  s = s.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*<]+)\*/g, "<em>$1</em>");
  s = s.replace(/~~([^~]+)~~/g, "<del>$1</del>");
  s = s.replace(/\x00CODE(\d+)\x00/g, function (m, i) {
    return "<code>" + mdEscape(codes[+i]) + "</code>";
  });
  return s;
}

function mdIsTableDelim(line) {
  return /^\s*\|?[\s:|-]+\|?[\s:|-]*$/.test(line) && line.indexOf("-") !== -1;
}

function mdSplitRow(line) {
  var t = String(line).trim().replace(/^\||\|$/g, "");
  return t.split("|").map(function (c) { return c.trim(); });
}

function renderMarkdown(src) {
  var lines = String(src || "").replace(/\r\n?/g, "\n").split("\n");
  var html = "", i = 0, n = lines.length;

  function isListItem(line) {
    return /^\s*(?:[-*+]|\d+[.)])\s+/.test(line);
  }

  while (i < n) {
    var line = lines[i];

    // Fenced code
    var fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      var lang = fence[1] ? ' class="language-' + fence[1] + '"' : "";
      var buf = [];
      i++;
      while (i < n && !/^```\s*$/.test(lines[i])) { buf.push(lines[i]); i++; }
      i++;
      html += "<pre><code" + lang + ">" + mdEscape(buf.join("\n")) + "</code></pre>";
      continue;
    }

    // Headings
    var h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      html += "<h" + h[1].length + ">" + mdInline(h[2]) + "</h" + h[1].length + ">";
      i++;
      continue;
    }

    // HR
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) { html += "<hr>"; i++; continue; }

    // Blank
    if (/^\s*$/.test(line)) { i++; continue; }

    // Table
    if (line.indexOf("|") !== -1 && i + 1 < n && mdIsTableDelim(lines[i + 1])) {
      var head = mdSplitRow(line);
      i += 2;
      html += "<thead><tr>" + head.map(function (c) { return "<th>" + mdInline(c) + "</th>"; }).join("") + "</tr></thead><tbody>";
      var rows = 0;
      while (i < n && lines[i].indexOf("|") !== -1 && rows < 50) {
        html += "<tr>" + mdSplitRow(lines[i]).map(function (c) { return "<td>" + mdInline(c) + "</td>"; }).join("") + "</tr>";
        i++; rows++;
      }
      html += "</tbody>";
      // wrap: reopen as table (we emitted thead directly — fix by wrapping)
      html = html.replace(/<thead>/, "<table><thead>") + "</table>";
      continue;
    }

    // Blockquote
    if (/^\s*>/.test(line)) {
      var q = [];
      while (i < n && /^\s*>/.test(lines[i])) { q.push(lines[i].replace(/^\s*> ?/, "")); i++; }
      html += "<blockquote>" + renderMarkdown(q.join("\n")) + "</blockquote>";
      continue;
    }

    // Lists (one nesting level via 2-space indent)
    if (isListItem(line)) {
      html += "<ul>";
      while (i < n && (isListItem(lines[i]) || /^\s{2,}\S/.test(lines[i]))) {
        var m = lines[i].match(/^(\s*)(?:[-*+]|\d+[.)])\s+(.*)$/);
        if (!m) break;
        var task = m[2].match(/^\[([ xX])\]\s+(.*)$/);
        if (task) {
          html += '<li class="task"><input type="checkbox" disabled' + (task[1].toLowerCase() === "x" ? " checked" : "") + " /> " + mdInline(task[2]) + "</li>";
        } else {
          html += "<li>" + mdInline(m[2]) + "</li>";
        }
        i++;
      }
      html += "</ul>";
      continue;
    }

    // Paragraph (join wrapped lines)
    var para = [line];
    i++;
    while (i < n && !/^\s*$/.test(lines[i]) && !isListItem(lines[i]) &&
      !/^(#{1,4}\s|```|>)/.test(lines[i]) && lines[i].indexOf("|") === -1) {
      para.push(lines[i]);
      i++;
    }
    html += "<p>" + mdInline(para.join(" ")) + "</p>";
  }
  return html;
}

/* ---------- store ---------- */
function notesSeed() {
  var now = Date.now();
  return {
    activeId: "welcome",
    notes: [{
      id: "welcome",
      title: "Welcome",
      updatedAt: now,
      body: "# Welcome to Notes\n\nQuick markdown scratchpad. Everything stays in **your browser** — nothing is uploaded.\n\n- [ ] Try the Preview toggle\n- [ ] Export me as `.md` below\n\n## Cheatsheet\n\n| Syntax | Result |\n| --- | --- |\n| `**bold**` | **bold** |\n| `*italic*` | *italic* |\n| `` `code` `` | `code` |\n| `[text](https://…)` | [link](https://cabscode.pro) |\n\n> Tip: open the full page at `/notes` for a sidebar library.\n",
    }],
  };
}

function notesLoad() {
  try {
    var raw = localStorage.getItem(NOTES_KEY);
    if (!raw) { var s = notesSeed(); notesSave(s); return s; }
    var s2 = JSON.parse(raw);
    if (!s2 || !Array.isArray(s2.notes)) return notesSeed();
    return s2;
  } catch (e) {
    return notesSeed();
  }
}

function notesSave(store) {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(store));
    return true;
  } catch (e) {
    return false; // quota / private mode
  }
}

function notesActive(store) {
  for (var i = 0; i < store.notes.length; i++) {
    if (store.notes[i].id === store.activeId) return store.notes[i];
  }
  return store.notes[0] || null;
}

function notesNewId() {
  return "n" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
}

/* ---------- editor binding ---------- */
var NT_SNIPS = {
  h: ["# ", ""],
  bold: ["**", "**"],
  italic: ["*", "*"],
  code: ["`", "`"],
  link: ["[", "](https://)"],
  list: ["\n- ", ""],
  task: ["\n- [ ] ", ""],
  quote: ["\n> ", ""],
  table: ["\n| A | B |\n| --- | --- |\n| ", " |  |\n"],
};

function ntInsert(ta, before, after) {
  var s = ta.selectionStart || 0, e = ta.selectionEnd || 0;
  var v = ta.value;
  var sel = v.slice(s, e) || "text";
  ta.value = v.slice(0, s) + before + sel + after + v.slice(e);
  ta.focus();
  ta.selectionStart = s + before.length;
  ta.selectionEnd = s + before.length + sel.length;
  ta.dispatchEvent(new Event("input", { bubbles: true }));
}

function ntWordCount(s) {
  var t = String(s || "").trim();
  if (!t) return { words: 0, chars: 0 };
  return { words: t.split(/\s+/).length, chars: String(s).length };
}

// ctx: {root, modeBtns, titleEl, bodyEl, previewEl, saveEl, countEl, selectEl,
//       newBtn, delBtn, expBtn, impEl, listEl, searchEl, pageMode}
function bindNotesEditor(ctx) {
  var store = notesLoad();
  var t = null;

  function persistFailed() {
    if (ctx.saveEl) ctx.saveEl.textContent = "Couldn't save — browser storage full or blocked.";
  }

  function paintPreview() {
    if (ctx.previewEl && ctx.bodyEl) {
      var v = ctx.bodyEl.value;
      ctx.previewEl.innerHTML = v.trim() ? renderMarkdown(v) : '<p class="tool-hint">Nothing to preview yet — write some markdown.</p>';
    }
    if (ctx.countEl && ctx.bodyEl) {
      var c = ntWordCount(ctx.bodyEl.value);
      ctx.countEl.textContent = c.words + " words · " + c.chars + " chars";
    }
  }

  function paintList() {
    if (!ctx.listEl) return;
    var q = (ctx.searchEl && ctx.searchEl.value || "").toLowerCase();
    var items = store.notes.slice().sort(function (a, b) { return b.updatedAt - a.updatedAt; });
    ctx.listEl.innerHTML = "";
    items.forEach(function (note) {
      if (q && (note.title + " " + note.body).toLowerCase().indexOf(q) === -1) return;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "np-item" + (note.id === store.activeId ? " is-active" : "");
      b.innerHTML = '<span class="np-item-title">' + mdEscape(note.title || "Untitled") + "</span>" +
        '<span class="np-item-date">' + new Date(note.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + "</span>";
      b.addEventListener("click", function () {
        store.activeId = note.id;
        notesSave(store);
        loadActive();
        paintList();
        if (ctx.selectEl) ctx.selectEl.value = note.id;
      });
      ctx.listEl.appendChild(b);
    });
  }

  function paintSelect() {
    if (!ctx.selectEl) return;
    ctx.selectEl.innerHTML = "";
    store.notes.forEach(function (note) {
      var o = document.createElement("option");
      o.value = note.id;
      o.textContent = note.title || "Untitled";
      if (note.id === store.activeId) o.selected = true;
      ctx.selectEl.appendChild(o);
    });
  }

  function loadActive() {
    var note = notesActive(store);
    if (ctx.titleEl) ctx.titleEl.value = note ? note.title : "";
    if (ctx.bodyEl) ctx.bodyEl.value = note ? note.body : "";
    paintPreview();
  }

  function saveActive() {
    var note = notesActive(store);
    if (!note) return;
    if (ctx.titleEl) note.title = ctx.titleEl.value.trim() || "Untitled";
    if (ctx.bodyEl) note.body = ctx.bodyEl.value;
    note.updatedAt = Date.now();
    if (notesSave(store)) {
      if (ctx.saveEl) ctx.saveEl.textContent = "Saved " + new Date().toLocaleTimeString("en-GB");
    } else {
      persistFailed();
    }
    paintList();
    paintSelect();
  }

  function scheduleSave() {
    paintPreview();
    if (t) clearTimeout(t);
    t = setTimeout(saveActive, 400);
  }

  if (ctx.bodyEl) ctx.bodyEl.addEventListener("input", scheduleSave);
  if (ctx.titleEl) ctx.titleEl.addEventListener("input", scheduleSave);

  if (ctx.modeBtns && ctx.modeBtns.length) {
    ctx.modeBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        ctx.modeBtns.forEach(function (x) {
          x.classList.toggle("is-active", x === b);
          x.setAttribute("aria-selected", x === b ? "true" : "false");
        });
        if (ctx.root) ctx.root.setAttribute("data-mode", b.getAttribute("data-nt-mode") || b.getAttribute("data-np-mode") || "split");
        paintPreview();
      });
    });
  }

  ctx.snipBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      var s = NT_SNIPS[b.getAttribute("data-snip")];
      if (s && ctx.bodyEl) ntInsert(ctx.bodyEl, s[0], s[1]);
    });
  });

  if (ctx.selectEl) {
    ctx.selectEl.addEventListener("change", function () {
      store.activeId = ctx.selectEl.value;
      notesSave(store);
      loadActive();
      paintList();
    });
  }

  function createNote() {
    var note = { id: notesNewId(), title: "Untitled", body: "", updatedAt: Date.now() };
    store.notes.push(note);
    store.activeId = note.id;
    notesSave(store);
    loadActive();
    paintList();
    paintSelect();
    if (ctx.titleEl) { ctx.titleEl.focus(); ctx.titleEl.select(); }
  }

  if (ctx.newBtn) ctx.newBtn.addEventListener("click", createNote);

  if (ctx.delBtn) ctx.delBtn.addEventListener("click", function () {
    var note = notesActive(store);
    if (!note) return;
    if (!window.confirm('Delete "' + (note.title || "Untitled") + '"?')) return;
    store.notes = store.notes.filter(function (x) { return x.id !== note.id; });
    if (!store.notes.length) {
      var fresh = { id: notesNewId(), title: "Untitled", body: "", updatedAt: Date.now() };
      store.notes.push(fresh);
    }
    store.activeId = store.notes[0].id;
    notesSave(store);
    loadActive();
    paintList();
    paintSelect();
  });

  if (ctx.expBtn) ctx.expBtn.addEventListener("click", function () {
    var note = notesActive(store);
    if (!note) return;
    var name = (note.title || "note").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "note";
    var blob = new Blob([note.body], { type: "text/markdown" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name + ".md";
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  });

  if (ctx.impEl) ctx.impEl.addEventListener("change", function () {
    var f = ctx.impEl.files && ctx.impEl.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      var title = f.name.replace(/\.md$/i, "").replace(/[-_]+/g, " ") || "Imported";
      var note = { id: notesNewId(), title: title, body: String(r.result || ""), updatedAt: Date.now() };
      store.notes.push(note);
      store.activeId = note.id;
      notesSave(store);
      loadActive();
      paintList();
      paintSelect();
    };
    r.readAsText(f);
    ctx.impEl.value = "";
  });

  if (ctx.searchEl) ctx.searchEl.addEventListener("input", paintList);

  loadActive();
  paintList();
  paintSelect();
  if (ctx.saveEl && store.notes.length) ctx.saveEl.textContent = "Loaded from this browser.";
}

/* ---------- studio card ---------- */
function initNotesTool(card) {
  if (card.notesInitialized) return;
  card.notesInitialized = true;
  var q = function (sel) { return card.querySelector(sel); };
  bindNotesEditor({
    root: card.querySelector(".nt-wrap"),
    modeBtns: Array.prototype.slice.call(card.querySelectorAll("[data-nt-mode]")),
    titleEl: q("#nt-title"),
    bodyEl: q("#nt-body"),
    previewEl: q("#nt-preview"),
    saveEl: q("#nt-save-state"),
    countEl: q("#nt-count"),
    selectEl: q("#nt-note-select"),
    newBtn: q("#nt-new"),
    delBtn: q("#nt-delete"),
    expBtn: q("#nt-export"),
    impEl: q("#nt-import"),
    snipBtns: Array.prototype.slice.call(card.querySelectorAll("[data-snip]")),
    listEl: null,
    searchEl: null,
  });
}

/* ---------- dedicated page ---------- */
function initNotesPage() {
  var q = function (sel) { return document.querySelector(sel); };
  bindNotesEditor({
    root: q("#np-app"),
    modeBtns: Array.prototype.slice.call(document.querySelectorAll("[data-np-mode]")),
    titleEl: q("#np-title"),
    bodyEl: q("#np-body"),
    previewEl: q("#np-preview"),
    saveEl: q("#np-save-state"),
    countEl: q("#np-count"),
    selectEl: null,
    newBtn: q("#np-new"),
    delBtn: q("#np-delete"),
    expBtn: q("#np-export"),
    impEl: q("#np-import"),
    snipBtns: Array.prototype.slice.call(document.querySelectorAll("[data-snip]")),
    listEl: q("#np-list"),
    searchEl: q("#np-search"),
  });
}
