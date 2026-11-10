// Tiny, safe Markdown renderer for journal posts.
// All input is HTML-escaped first, so only the tags produced below can appear.
(function () {
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function inline(s) {
    s = esc(s);
    var codes = [];
    s = s.replace(/`([^`]+)`/g, function (_, c) {
      codes.push("<code>" + c + "</code>");
      return "\u0000" + (codes.length - 1) + "\u0000";
    });
    s = s.replace(/!\[([^\]]*)\]\(((?:https?:\/\/|\/)[^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />');
    s = s.replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/|#|mailto:)[^)\s]*)\)/g, '<a href="$2" rel="noopener">$1</a>');
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
    return s.replace(/\u0000(\d+)\u0000/g, function (_, i) { return codes[+i]; });
  }

  function render(md) {
    var lines = String(md || "").replace(/\r\n?/g, "\n").split("\n");
    var out = [];
    var i = 0;
    while (i < lines.length) {
      var line = lines[i];
      var m;
      if (/^```/.test(line)) {
        var lang = line.replace(/^```/, "").trim().replace(/[^a-z0-9+#-]/gi, "");
        var buf = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
        i++;
        out.push('<pre><code class="language-' + (lang || "none") + '">' + esc(buf.join("\n")) + "</code></pre>");
      } else if ((m = /^(#{1,3})\s+(.*)$/.exec(line))) {
        var lvl = m[1].length + 1; // # -> h2 (the page title is the h1)
        out.push("<h" + lvl + ">" + inline(m[2]) + "</h" + lvl + ">");
        i++;
      } else if (/^>\s?/.test(line)) {
        var q = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, ""));
        out.push("<blockquote>" + inline(q.join(" ")) + "</blockquote>");
      } else if (/^\s*[-*]\s+/.test(line)) {
        var items = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push("<li>" + inline(lines[i++].replace(/^\s*[-*]\s+/, "")) + "</li>");
        out.push("<ul>" + items.join("") + "</ul>");
      } else if (/^\s*\d+\.\s+/.test(line)) {
        var oitems = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) oitems.push("<li>" + inline(lines[i++].replace(/^\s*\d+\.\s+/, "")) + "</li>");
        out.push("<ol>" + oitems.join("") + "</ol>");
      } else if (/^---+\s*$/.test(line)) {
        out.push("<hr />");
        i++;
      } else if (!line.trim()) {
        i++;
      } else {
        var p = [];
        while (i < lines.length && lines[i].trim() && !/^(```|#{1,3}\s|>|\s*[-*]\s+|\s*\d+\.\s+|---+\s*$)/.test(lines[i])) p.push(lines[i++]);
        out.push("<p>" + inline(p.join(" ")) + "</p>");
      }
    }
    return out.join("\n");
  }

  window.CcMarkdown = { render: render, escape: esc };
})();
