document.addEventListener("DOMContentLoaded", function () {
  // Feed filter (index only)
  var chips = document.querySelectorAll("[data-filter]");
  var cards = document.querySelectorAll("[data-category]");
  var empty = document.getElementById("jpEmpty");

  function applyFilter(cat) {
    var shown = 0;
    cards.forEach(function (c) {
      var ok = cat === "all" || c.getAttribute("data-category") === cat;
      c.hidden = !ok;
      if (ok) shown++;
    });
    if (empty) empty.hidden = shown !== 0;
    chips.forEach(function (ch) {
      var on = ch.getAttribute("data-filter") === cat;
      ch.classList.toggle("is-active", on);
      ch.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  chips.forEach(function (ch) {
    ch.addEventListener("click", function () {
      applyFilter(ch.getAttribute("data-filter"));
    });
  });

  // Redesigned manual accordion (index rail)
  document.querySelectorAll(".jp-accordion-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".jp-accordion-item");
      if (!item) return;
      var open = item.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      var panel = item.querySelector(".jp-accordion-panel");
      if (panel) panel.setAttribute("aria-hidden", open ? "false" : "true");
    });
  });

  // Mobile sheet toggle
  var sheetToggle = document.getElementById("jpSheetToggle");
  var leftRail = document.querySelector(".jp-rail--left");
  if (sheetToggle && leftRail) {
    sheetToggle.addEventListener("click", function () {
      leftRail.classList.toggle("is-open");
    });
    leftRail.addEventListener("click", function (e) {
      if (e.target === leftRail) leftRail.classList.remove("is-open");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") leftRail.classList.remove("is-open");
    });
  }

  // JSON-driven sidebar (article pages only) — mount [data-sidebar]
  var sidebarMount = document.querySelector("[data-sidebar]");
  if (sidebarMount) {
    var path = sidebarMount.getAttribute("data-path") || "";
    var jsonUrl = sidebarMount.getAttribute("data-src") || "../data/articles.json";
    // allow absolute from site root when served at /journal-preview/articles/*
    if (path && jsonUrl.charAt(0) !== "/" && jsonUrl.indexOf("../") === 0) {
      // keep relative as-is
    }
    fetch(jsonUrl)
      .then(function (r) { return r.json(); })
      .then(function (items) {
        // Group by kicker in fixed order: Personal Projects, Web Development
        var order = ["Personal Projects", "Web Development"];
        var groups = {};
        items.forEach(function (it) {
          var k = it.kicker || "Uncategorized";
          if (!groups[k]) groups[k] = [];
          groups[k].push(it);
        });

        var total = items.length;
        var html = '<div class="jp-card">';
        html += '<div class="jp-manual-head"><h3>Journal</h3><span class="jp-manual-count">' + total + '</span></div>';
        html += '<ul class="jp-accordion" role="list">';

        order.forEach(function (kicker) {
          var list = groups[kicker] || [];
          if (!list.length) return;
          var isActiveGroup = list.some(function (it) { return it.slug === path; });
          var icon = kicker === "Personal Projects" ? "folder" : "globe";
          html += '<li class="jp-accordion-item' + (isActiveGroup ? ' is-open' : '') + '">';
          html += '<button class="jp-accordion-toggle" aria-expanded="' + (isActiveGroup ? 'true' : 'false') + '">';
          html += '<span class="jp-accordion-toggle-left"><i data-lucide="' + icon + '" class="jp-accordion-chevron" style="width:14px;height:14px"></i>' + kicker + '</span>';
          html += '<span class="jp-manual-count">' + list.length + '</span>';
          html += '</button>';
          html += '<ul class="jp-accordion-panel" aria-hidden="' + (isActiveGroup ? 'false' : 'true') + '">';
          list.forEach(function (it) {
            var isCurrent = it.slug === path;
            var linkIcon = it.slug === "zorin-os" ? "laptop" : it.slug === "portfolio" ? "layout" : "folder-cog";
            html += '<li><a class="jp-accordion-link' + (isCurrent ? ' is-current' : '') + '" href="' + it.href + '"><i data-lucide="' + linkIcon + '" style="width:12px;height:12px;flex-shrink:0"></i>' + it.title + '</a></li>';
          });
          html += '</ul></li>';
        });

        // any stray groups not in order
        Object.keys(groups).forEach(function (k) {
          if (order.indexOf(k) !== -1) return;
          var list = groups[k];
          html += '<li class="jp-accordion-item"><button class="jp-accordion-toggle" aria-expanded="false"><span class="jp-accordion-toggle-left"><i data-lucide="folder" style="width:14px;height:14px"></i>' + k + '</span><span class="jp-manual-count">' + list.length + '</span></button><ul class="jp-accordion-panel" aria-hidden="true">';
          list.forEach(function (it) {
            html += '<li><a class="jp-accordion-link' + (it.slug === path ? ' is-current' : '') + '" href="' + it.href + '">' + it.title + '</a></li>';
          });
          html += '</ul></li>';
        });

        html += '</ul></div>';

        sidebarMount.innerHTML = html;
        if (window.lucide) lucide.createIcons();

        // re-bind accordion toggles for this injected rail
        sidebarMount.querySelectorAll(".jp-accordion-toggle").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var item = btn.closest(".jp-accordion-item");
            var open = item.classList.toggle("is-open");
            btn.setAttribute("aria-expanded", open ? "true" : "false");
            var p = item.querySelector(".jp-accordion-panel");
            if (p) p.setAttribute("aria-hidden", open ? "false" : "true");
          });
        });

        // Next/Prev
        var idx = -1;
        for (var i = 0; i < items.length; i++) if (items[i].slug === path) idx = i;
        var navWrap = document.getElementById("jpNextPrev");
        if (navWrap && idx !== -1) {
          var prev = idx > 0 ? items[idx - 1] : null;
          var next = idx < items.length - 1 ? items[idx + 1] : null;
          var navHtml = "";
          if (prev) navHtml += '<a href="' + prev.href + '"><span>Previous</span>' + prev.title + '</a>';
          else navHtml += '<span></span>';
          if (next) navHtml += '<a href="' + next.href + '"><span>Next</span>' + next.title + '</a>';
          navWrap.innerHTML = navHtml;
        }

        // Related (same category)
        var relatedWrap = document.getElementById("jpRelated");
        if (relatedWrap && idx !== -1) {
          var cur = items[idx];
          var related = items.filter(function (it) { return it.category === cur.category && it.slug !== cur.slug; });
          if (related.length) {
            var rel = '<h4>More in ' + cur.kicker + '</h4>';
            related.forEach(function (it) {
              rel += '<a href="' + it.href + '">' + it.title + '</a>';
            });
            relatedWrap.innerHTML = rel;
          }
        }
      })
      .catch(function () {
        sidebarMount.innerHTML = '<div class="jp-card"><p style="color:var(--color-text-secondary);font-size:0.9rem">Could not load navigation.</p></div>';
      });
  }

  // ToC spy (article pages — looks for [data-toc])
  var toc = document.querySelector("[data-toc]");
  var prose = document.querySelector(".jp-prose, .journal-body");
  if (toc && prose) {
    var headings = prose.querySelectorAll("h2, h3");
    if (!headings.length) {
      toc.hidden = true;
    } else {
      var links = [];
      headings.forEach(function (h, i) {
        if (!h.id) h.id = "sec-" + i + "-" + h.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
        var a = document.createElement("a");
        a.href = "#" + h.id;
        a.textContent = h.textContent;
        if (h.tagName === "H3") a.style.paddingLeft = "18px";
        toc.appendChild(a);
        links.push({ h: h, a: a });
      });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (ent) {
          if (ent.isIntersecting) {
            links.forEach(function (L) { L.a.classList.toggle("is-active", L.h === ent.target); });
          }
        });
      }, { rootMargin: "-30% 0px -60% 0px", threshold: 0 });
      links.forEach(function (L) { io.observe(L.h); });
    }
  }
});
