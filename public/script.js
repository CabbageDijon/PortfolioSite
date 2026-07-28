document.addEventListener("DOMContentLoaded", () => {
  // 0. Dark Mode
  var html = document.documentElement;
  var darkToggle = document.getElementById("darkToggle");

  function setTheme(theme) {
    html.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    if (darkToggle) {
      darkToggle.textContent = theme === "dark" ? "☀" : "☾";
    }
  }

  var saved = localStorage.getItem("theme");
  if (saved) {
    setTheme(saved);
  } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    setTheme("dark");
  } else {
    setTheme("light");
  }

  if (darkToggle) {
    darkToggle.addEventListener("click", function () {
      var current = html.getAttribute("data-theme");
      setTheme(current === "dark" ? "light" : "dark");
    });
  }

  // 1. Mobile Menu Toggle Logic
  const mobileToggle = document.querySelector(".mobile-toggle");
  const navRight = document.querySelector(".nav-right");

  var navOverlay = document.getElementById("navOverlay");

  if (mobileToggle && navRight) {
    mobileToggle.addEventListener("click", () => {
      navRight.classList.toggle("active");
      if (navOverlay) navOverlay.classList.toggle("visible");
    });

    document.addEventListener("click", (e) => {
      if (navRight.classList.contains("active")) {
        if (!navRight.contains(e.target) && !mobileToggle.contains(e.target)) {
          navRight.classList.remove("active");
          if (navOverlay) navOverlay.classList.remove("visible");
        }
      }
    });
  }

  if (navOverlay) {
    navOverlay.addEventListener("click", function () {
      navRight.classList.remove("active");
      navOverlay.classList.remove("visible");
    });
  }

  // --- Accordion Sidebar Logic ---
  const accordionToggles = document.querySelectorAll(".accordion-toggle");

  accordionToggles.forEach((toggle) => {
    toggle.addEventListener("click", function () {
      const parentItem = this.parentElement;
      parentItem.classList.toggle("active");
    });
  });

  // --- Journal Sidebar Collapse Toggle ---
  var sidebar = document.querySelector(".sidebar");

  if (sidebar && !window.matchMedia("(max-width: 768px)").matches) {
    var sidebarToggle = sidebar.querySelector("h3");
    if (sidebarToggle) {
      sidebarToggle.addEventListener("click", function () {
        sidebar.classList.toggle("collapsed");
      });
    }
  }

  // --- Mobile Journal Sidebar Drawer Logic ---
  const journalSidebar = document.querySelector(".sidebar");
  const journalToggle = document.getElementById("journalSidebarToggle");

  if (journalToggle && journalSidebar) {
    journalToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      journalSidebar.classList.toggle("mobile-open");
    });

    window.addEventListener(
      "scroll",
      () => {
        if (journalSidebar.classList.contains("mobile-open")) {
          journalSidebar.classList.remove("mobile-open");
        }
      },
      { passive: true },
    );

    document.addEventListener("click", (e) => {
      if (journalSidebar.classList.contains("mobile-open")) {
        if (
          !journalSidebar.contains(e.target) &&
          !journalToggle.contains(e.target)
        ) {
          journalSidebar.classList.remove("mobile-open");
        }
      }
    });
  }

  // 2. Contact Form — JS Component Injection
  initContactForm();

  // 2b. View Transitions API
  if (document.startViewTransition) {
    var internalLinks = document.querySelectorAll('a[href^="/"]:not([href*="#"]), a[href^="."]');
    internalLinks.forEach(function (link) {
      link.addEventListener("click", function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        document.startViewTransition(function () {
          window.location = link.href;
        });
      });
    });
  }

  // 2c. Banner mouse-tracking parallax
  var banner = document.querySelector(".about-banner");
  if (banner) {
    banner.addEventListener("mouseenter", function () {
      banner.style.animationPlayState = "paused";
    });

    banner.addEventListener("mousemove", function (e) {
      var rect = banner.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
      var y = ((e.clientY - rect.top) / rect.height - 0.5) * 16;
      banner.style.backgroundPosition = (50 + x) + "% " + (50 + y) + "%";
    });

    banner.addEventListener("mouseleave", function () {
      banner.style.backgroundPosition = "";
      banner.style.animationPlayState = "running";
    });
  }

  // 3. Hashless Smooth Scrolling for Contact Links
  const contactLinks = document.querySelectorAll('a[href="#contactForm"]');

  contactLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();

      const targetElement = document.getElementById("contactForm");

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        if (navRight && navRight.classList.contains("active")) {
          navRight.classList.remove("active");
          if (navOverlay) navOverlay.classList.remove("visible");
        }
      }
    });
  });
});

// --- Contact Form Component ---
var TURNSTILE_SITE_KEY = "0x4AAAAAAD8uiSyRouhkF0Zo";
var turnstileWidgetId = null;
var turnstileFailed = false;

function initContactForm() {
  const mount = document.getElementById("contactFormMount");
  if (!mount) return;

  mount.innerHTML = [
    '<form action="/api/contact" method="POST" id="contactForm">',
    '  <div class="honeypot" aria-hidden="true">',
    '    <input type="text" name="website" tabindex="-1" autocomplete="off" />',
    "  </div>",
    '  <input type="hidden" name="_timestamp" value="' + Date.now() + '" />',
    '  <label for="contact-email" class="sr-only">Email</label>',
    '  <input type="email" name="email" id="contact-email" placeholder="Your Email" required />',
    '  <label for="contact-message" class="sr-only">Message</label>',
    '  <textarea name="message" id="contact-message" placeholder="Tell me about your project..." rows="3" required></textarea>',
    '  <div id="turnstile-widget"></div>',
    '  <button type="submit" class="contact-btn">Send Request</button>',
    '  <div id="formStatus" class="form-status" role="alert" aria-live="polite"></div>',
    "</form>",
  ].join("");

  renderTurnstileWidget();
  attachFormHandler();
}

function renderTurnstileWidget(attempt) {
  if (attempt === undefined) attempt = 0;
  if (attempt >= 50) {
    turnstileFailed = true;
    var status = document.getElementById("formStatus");
    if (status) {
      status.textContent = "Security check failed to load. Refresh the page or try again later.";
      status.className = "form-status error";
    }
    return;
  }

  var container = document.getElementById("turnstile-widget");
  if (!container) return;

  if (typeof turnstile !== "undefined") {
    try {
      turnstileWidgetId = turnstile.render("#turnstile-widget", {
        sitekey: TURNSTILE_SITE_KEY,
        theme: "light",
        "error-callback": function () {
          turnstileFailed = true;
          var status = document.getElementById("formStatus");
          if (status) {
            status.textContent = "Security check unavailable. Submit anyway or refresh.";
            status.className = "form-status error";
          }
        },
      });
    } catch (e) {
      turnstileFailed = true;
    }
  } else {
    setTimeout(function () { renderTurnstileWidget(attempt + 1); }, 200);
  }
}

function attachFormHandler() {
  var form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    var email = form.email.value.trim();
    var message = form.message.value.trim();
    var status = document.getElementById("formStatus");
    var submitBtn = form.querySelector('button[type="submit"]');

    if (!email || !message) {
      status.textContent = "Please fill in all fields.";
      status.className = "form-status error";
      return;
    }

    var timestamp = parseInt(form._timestamp.value, 10);
    var elapsed = Date.now() - timestamp;
    if (elapsed < 3000 || elapsed > 1800000) {
      status.textContent = "Submission rejected. Please try again.";
      status.className = "form-status error";
      return;
    }

    var token = typeof turnstile !== "undefined" ? turnstile.getResponse() : "";

    if (!token) {
      if (turnstileFailed) {
        status.textContent = "Security check is down. You can submit, but the message may be flagged.";
        status.className = "form-status error";
      } else {
        status.textContent = "Please complete the security check.";
        status.className = "form-status error";
        return;
      }
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    status.textContent = "";
    status.className = "form-status";

    try {
      var res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          message: message,
          "cf-turnstile-response": token,
          _timestamp: timestamp,
        }),
      });

      var data = await res.json();

      if (res.ok) {
        status.textContent = "Message sent successfully!";
        status.className = "form-status success";
        form.email.value = "";
        form.message.value = "";
        if (typeof turnstile !== "undefined") {
          turnstile.reset();
        }
      } else {
        status.textContent = data.error || "Failed to send message.";
        status.className = "form-status error";
        if (typeof turnstile !== "undefined") {
          turnstile.reset();
        }
      }
    } catch (_err) {
      status.textContent = "Could not reach the server. If testing locally, the API endpoint is only available in production.";
      status.className = "form-status error";
    }

    submitBtn.textContent = "Send Request";
    submitBtn.disabled = false;
  });
}

// --- Expandable Web Tools Logic ---
var expandableCards = document.querySelectorAll(".expandable-card");

expandableCards.forEach(function (card) {
  var expandBtn = card.querySelector(".expand-btn");
  var closeBtn = card.querySelector(".close-btn");

  if (expandBtn && closeBtn) {
    expandBtn.addEventListener("click", function (e) {
      e.preventDefault();
      card.classList.add("is-expanded");

      // Init QR tool if not yet done
      if (card.id === "qr-tool") {
        initQRTool(card);
      }

      setTimeout(function () {
        card.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    });

    closeBtn.addEventListener("click", function (e) {
      e.preventDefault();
      card.classList.remove("is-expanded");
    });
  }
});

// --- Code Snippet Copy Buttons ---
var codeBlocks = document.querySelectorAll("pre code");
codeBlocks.forEach(function (code) {
  var pre = code.parentElement;
  var btn = document.createElement("button");
  btn.className = "copy-btn";
  btn.textContent = "Copy";
  pre.appendChild(btn);

  btn.addEventListener("click", function () {
    var text = code.textContent;
    navigator.clipboard.writeText(text).then(function () {
      btn.textContent = "Copied!";
      btn.classList.add("copied");
      setTimeout(function () {
        btn.textContent = "Copy";
        btn.classList.remove("copied");
      }, 2000);
    }).catch(function () {
      btn.textContent = "Failed";
      setTimeout(function () {
        btn.textContent = "Copy";
      }, 2000);
    });
  });
});

// --- QR Code Generator ---
function initQRTool(card) {
  if (card.qrInitialized) return;
  card.qrInitialized = true;

  var input = card.querySelector("#qr-input");
  var sizeSelect = card.querySelector("#qr-size");
  var downloadBtn = card.querySelector("#qr-download");
  var container = card.querySelector("#qr-code");

  var qr = null;

  function generateQR() {
    var text = input.value.trim() || "https://cabscode.pro";
    var size = parseInt(sizeSelect.value, 10);
    container.innerHTML = "";
    qr = new QRCode(container, {
      text: text,
      width: size,
      height: size,
      colorDark: "#1a1a1a",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });
  }

  input.addEventListener("input", generateQR);
  sizeSelect.addEventListener("change", generateQR);

  downloadBtn.addEventListener("click", function () {
    var canvas = container.querySelector("canvas");
    if (canvas) {
      var link = document.createElement("a");
      link.download = "qrcode.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  });

  generateQR();
}
