document.addEventListener("DOMContentLoaded", () => {
  // 1. Mobile Menu Toggle Logic
  const mobileToggle = document.querySelector(".mobile-toggle");
  const navRight = document.querySelector(".nav-right");

  if (mobileToggle && navRight) {
    mobileToggle.addEventListener("click", () => {
      navRight.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
      if (navRight.classList.contains("active")) {
        if (!navRight.contains(e.target) && !mobileToggle.contains(e.target)) {
          navRight.classList.remove("active");
        }
      }
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
        }
      }
    });
  });
});

// --- Contact Form Component ---
function initContactForm() {
  const mount = document.getElementById("contactFormMount");
  if (!mount) return;

  const siteKey = "0x4AAAAAAD8uiSyRouhkF0Zo";

  mount.innerHTML = [
    '<form action="/api/contact" method="POST" id="contactForm">',
    '  <div class="honeypot" aria-hidden="true">',
    '    <input type="text" name="website" tabindex="-1" autocomplete="off" />',
    "  </div>",
    '  <input type="hidden" name="_timestamp" value="' + Date.now() + '" />',
    '  <input type="email" name="email" placeholder="Your Email" required />',
    '  <textarea name="message" placeholder="Tell me about your project..." rows="3" required></textarea>',
    '  <div id="turnstile-widget"></div>',
    '  <button type="submit" class="contact-btn">Send Request</button>',
    '  <div id="formStatus" class="form-status" role="alert" aria-live="polite"></div>',
    "</form>",
  ].join("");

  renderTurnstileWidget();
  attachFormHandler();
}

function renderTurnstileWidget() {
  var container = document.getElementById("turnstile-widget");
  if (!container) return;

  if (typeof turnstile !== "undefined") {
    turnstile.render("#turnstile-widget", {
      sitekey: "0x4AAAAAAD8uiSyRouhkF0Zo",
      theme: "light",
    });
  } else {
    setTimeout(renderTurnstileWidget, 200);
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
      status.textContent = "Please complete the security check.";
      status.className = "form-status error";
      return;
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
      status.textContent = "Network error. Please try again.";
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
