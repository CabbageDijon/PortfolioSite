/* CabsCode custom icons — Lucide-style stroke icons.
 * Separate namespace from Lucide (which removed brand icons in v1).
 * Usage: <i data-cc-icon="facebook"></i> then CcIcons.createIcons().
 * Spec matches Lucide: 24x24, fill none, stroke currentColor, width 2, round caps.
 */
(function () {
  var S = function (inner) {
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"' +
      ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"' +
      ' stroke-linejoin="round" aria-hidden="true">' + inner + "</svg>"
    );
  };

  var ICONS = {
    facebook: S('<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>'),
    instagram: S(
      '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>' +
        '<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>' +
        '<line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>'
    ),
    whatsapp: S(
      '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>' +
        '<path d="M9 10.5c.5 2.5 2.5 4.5 5 5l1.5-1.5 2 1c-.5 1.5-1.5 2-3 1.5-3.5-1-6.5-4-7.5-7.5-.5-1.5 0-2.5 1.5-3l1 2z"></path>'
    ),
    tiktok: S(
      '<path d="M9 12a4 4 0 1 0 4 4V4c.6 2.5 2.4 4.3 5 4.5"></path>'
    ),
    linkedin: S(
      '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>' +
        '<rect x="2" y="9" width="4" height="12"></rect>' +
        '<circle cx="4" cy="4" r="2"></circle>'
    ),
    gemini: S(
      '<path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z"></path>' +
        '<path d="M19 2l.9 2.1L22 5l-2.1.9L19 8l-.9-2.1L16 5l2.1-.9z"></path>'
    ),
    github: S(
      '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5c.08-1.25-.27-2.48-1-3.5c.28-1.15.28-2.35 0-3.5c0 0-1 0-3 1.5c-2.64-.5-5.36-.5-8 0C6 4 5 4 5 4c-.28 1.15-.28 2.35 0 3.5A2.75 2.75 0 0 0 4 11c0 3.5 3 5.5 6 5.5c-.39.49-.68 1.05-.85 1.65c-.17.6-.2 1.23-.08 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path>'
    ),
    globe: S(
      '<circle cx="12" cy="12" r="10"></circle>' +
        '<line x1="2" y1="12" x2="22" y2="12"></line>' +
        '<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>'
    ),
  };

  function createIcons(root) {
    var scope = root || document;
    var els = scope.querySelectorAll("[data-cc-icon]");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var name = el.getAttribute("data-cc-icon");
      if (ICONS[name]) {
        el.innerHTML = ICONS[name];
        el.classList.add("cc-icon");
      }
    }
  }

  window.CcIcons = { icons: ICONS, createIcons: createIcons };
  document.addEventListener("DOMContentLoaded", function () {
    createIcons(document);
  });
})();
