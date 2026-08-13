document.addEventListener("DOMContentLoaded", () => {
  // 0. Dark Mode
  var html = document.documentElement;
  var darkToggle = document.getElementById("darkToggle");

  function setTheme(theme) {
    html.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    try {
      document.dispatchEvent(
        new CustomEvent("themechange", { detail: { theme: theme } }),
      );
    } catch (e) {}
    if (darkToggle) {
      if (window.lucide) {
        darkToggle.innerHTML =
          theme === "dark"
            ? '<i data-lucide="sun"></i>'
            : '<i data-lucide="moon"></i>';
        lucide.createIcons();
      } else {
        darkToggle.textContent = theme === "dark" ? "☀" : "☾";
      }
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

  // 2a. Service CTA pickers
  initServicePickers();

  // 2b. View Transitions API
  if (document.startViewTransition) {
    var internalLinks = document.querySelectorAll(
      'a[href^="/"]:not([href*="#"]), a[href^="."]',
    );
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

  // 2c. Banner gradient follows mouse
  var banner = document.querySelector(".about-banner");
  if (banner) {
    banner.addEventListener("mousemove", function (e) {
      var rect = banner.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      var y = ((e.clientY - rect.top) / rect.height) * 100;
      banner.style.backgroundPosition = x + "% " + y + "%";
    });

    banner.addEventListener("mouseleave", function () {
      banner.style.backgroundPosition = "50% 50%";
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
var COUNTRY_CODES = [
  { name: "Botswana",        dial: "+267", code: "BW" },
  { name: "South Africa",    dial: "+27",  code: "ZA" },
  { name: "Namibia",         dial: "+264", code: "NA" },
  { name: "Zambia",          dial: "+260", code: "ZM" },
  { name: "Afghanistan",     dial: "+93",  code: "AF" },
  { name: "Albania",         dial: "+355", code: "AL" },
  { name: "Algeria",         dial: "+213", code: "DZ" },
  { name: "Argentina",       dial: "+54",  code: "AR" },
  { name: "Armenia",         dial: "+374", code: "AM" },
  { name: "Australia",       dial: "+61",  code: "AU" },
  { name: "Austria",         dial: "+43",  code: "AT" },
  { name: "Azerbaijan",      dial: "+994", code: "AZ" },
  { name: "Bahrain",         dial: "+973", code: "BH" },
  { name: "Bangladesh",      dial: "+880", code: "BD" },
  { name: "Belgium",         dial: "+32",  code: "BE" },
  { name: "Benin",           dial: "+229", code: "BJ" },
  { name: "Bolivia",         dial: "+591", code: "BO" },
  { name: "Bosnia & Herzegovina", dial: "+387", code: "BA" },
  { name: "Brazil",          dial: "+55",  code: "BR" },
  { name: "Brunei",          dial: "+673", code: "BN" },
  { name: "Bulgaria",        dial: "+359", code: "BG" },
  { name: "Burkina Faso",    dial: "+226", code: "BF" },
  { name: "Burundi",         dial: "+257", code: "BI" },
  { name: "Cambodia",        dial: "+855", code: "KH" },
  { name: "Cameroon",        dial: "+237", code: "CM" },
  { name: "Canada",          dial: "+1",   code: "CA" },
  { name: "Chad",            dial: "+235", code: "TD" },
  { name: "Chile",           dial: "+56",  code: "CL" },
  { name: "China",           dial: "+86",  code: "CN" },
  { name: "Colombia",        dial: "+57",  code: "CO" },
  { name: "Congo (DRC)",     dial: "+243", code: "CD" },
  { name: "Congo (Republic)", dial: "+242", code: "CG" },
  { name: "Costa Rica",      dial: "+506", code: "CR" },
  { name: "Croatia",         dial: "+385", code: "HR" },
  { name: "Cuba",            dial: "+53",  code: "CU" },
  { name: "Cyprus",          dial: "+357", code: "CY" },
  { name: "Czech Republic",  dial: "+420", code: "CZ" },
  { name: "Denmark",         dial: "+45",  code: "DK" },
  { name: "Djibouti",        dial: "+253", code: "DJ" },
  { name: "Ecuador",         dial: "+593", code: "EC" },
  { name: "Egypt",           dial: "+20",  code: "EG" },
  { name: "El Salvador",     dial: "+503", code: "SV" },
  { name: "Eritrea",         dial: "+291", code: "ER" },
  { name: "Estonia",         dial: "+372", code: "EE" },
  { name: "Eswatini",        dial: "+268", code: "SZ" },
  { name: "Ethiopia",        dial: "+251", code: "ET" },
  { name: "Fiji",            dial: "+679", code: "FJ" },
  { name: "Finland",         dial: "+358", code: "FI" },
  { name: "France",          dial: "+33",  code: "FR" },
  { name: "Gabon",           dial: "+241", code: "GA" },
  { name: "Gambia",          dial: "+220", code: "GM" },
  { name: "Georgia",         dial: "+995", code: "GE" },
  { name: "Germany",         dial: "+49",  code: "DE" },
  { name: "Ghana",           dial: "+233", code: "GH" },
  { name: "Greece",          dial: "+30",  code: "GR" },
  { name: "Guatemala",       dial: "+502", code: "GT" },
  { name: "Guinea",          dial: "+224", code: "GN" },
  { name: "Guyana",          dial: "+592", code: "GY" },
  { name: "Haiti",           dial: "+509", code: "HT" },
  { name: "Honduras",        dial: "+504", code: "HN" },
  { name: "Hong Kong",       dial: "+852", code: "HK" },
  { name: "Hungary",         dial: "+36",  code: "HU" },
  { name: "Iceland",         dial: "+354", code: "IS" },
  { name: "India",           dial: "+91",  code: "IN" },
  { name: "Indonesia",       dial: "+62",  code: "ID" },
  { name: "Iran",            dial: "+98",  code: "IR" },
  { name: "Iraq",            dial: "+964", code: "IQ" },
  { name: "Ireland",         dial: "+353", code: "IE" },
  { name: "Israel",          dial: "+972", code: "IL" },
  { name: "Italy",           dial: "+39",  code: "IT" },
  { name: "Ivory Coast",     dial: "+225", code: "CI" },
  { name: "Jamaica",         dial: "+1-876", code: "JM" },
  { name: "Japan",           dial: "+81",  code: "JP" },
  { name: "Jordan",          dial: "+962", code: "JO" },
  { name: "Kazakhstan",      dial: "+7",   code: "KZ" },
  { name: "Kenya",           dial: "+254", code: "KE" },
  { name: "Kuwait",          dial: "+965", code: "KW" },
  { name: "Kyrgyzstan",      dial: "+996", code: "KG" },
  { name: "Laos",            dial: "+856", code: "LA" },
  { name: "Latvia",          dial: "+371", code: "LV" },
  { name: "Lebanon",         dial: "+961", code: "LB" },
  { name: "Liberia",         dial: "+231", code: "LR" },
  { name: "Libya",           dial: "+218", code: "LY" },
  { name: "Lithuania",       dial: "+370", code: "LT" },
  { name: "Luxembourg",      dial: "+352", code: "LU" },
  { name: "Madagascar",      dial: "+261", code: "MG" },
  { name: "Malawi",          dial: "+265", code: "MW" },
  { name: "Malaysia",        dial: "+60",  code: "MY" },
  { name: "Mali",            dial: "+223", code: "ML" },
  { name: "Malta",           dial: "+356", code: "MT" },
  { name: "Mauritania",      dial: "+222", code: "MR" },
  { name: "Mauritius",       dial: "+230", code: "MU" },
  { name: "Mexico",          dial: "+52",  code: "MX" },
  { name: "Moldova",         dial: "+373", code: "MD" },
  { name: "Monaco",          dial: "+377", code: "MC" },
  { name: "Mongolia",        dial: "+976", code: "MN" },
  { name: "Montenegro",      dial: "+382", code: "ME" },
  { name: "Morocco",         dial: "+212", code: "MA" },
  { name: "Mozambique",      dial: "+258", code: "MZ" },
  { name: "Myanmar",         dial: "+95",  code: "MM" },
  { name: "Nepal",           dial: "+977", code: "NP" },
  { name: "Netherlands",     dial: "+31",  code: "NL" },
  { name: "New Zealand",     dial: "+64",  code: "NZ" },
  { name: "Niger",           dial: "+227", code: "NE" },
  { name: "Nigeria",         dial: "+234", code: "NG" },
  { name: "North Korea",     dial: "+850", code: "KP" },
  { name: "North Macedonia", dial: "+389", code: "MK" },
  { name: "Norway",          dial: "+47",  code: "NO" },
  { name: "Oman",            dial: "+968", code: "OM" },
  { name: "Pakistan",        dial: "+92",  code: "PK" },
  { name: "Palestine",       dial: "+970", code: "PS" },
  { name: "Panama",          dial: "+507", code: "PA" },
  { name: "Paraguay",        dial: "+595", code: "PY" },
  { name: "Peru",            dial: "+51",  code: "PE" },
  { name: "Philippines",     dial: "+63",  code: "PH" },
  { name: "Poland",          dial: "+48",  code: "PL" },
  { name: "Portugal",        dial: "+351", code: "PT" },
  { name: "Qatar",           dial: "+974", code: "QA" },
  { name: "Romania",         dial: "+40",  code: "RO" },
  { name: "Russia",          dial: "+7",   code: "RU" },
  { name: "Rwanda",          dial: "+250", code: "RW" },
  { name: "Saudi Arabia",    dial: "+966", code: "SA" },
  { name: "Senegal",         dial: "+221", code: "SN" },
  { name: "Serbia",          dial: "+381", code: "RS" },
  { name: "Sierra Leone",    dial: "+232", code: "SL" },
  { name: "Singapore",       dial: "+65",  code: "SG" },
  { name: "Slovakia",        dial: "+421", code: "SK" },
  { name: "Slovenia",        dial: "+386", code: "SI" },
  { name: "Somalia",         dial: "+252", code: "SO" },
  { name: "South Korea",     dial: "+82",  code: "KR" },
  { name: "South Sudan",     dial: "+211", code: "SS" },
  { name: "Spain",           dial: "+34",  code: "ES" },
  { name: "Sri Lanka",       dial: "+94",  code: "LK" },
  { name: "Sudan",           dial: "+249", code: "SD" },
  { name: "Suriname",        dial: "+597", code: "SR" },
  { name: "Sweden",          dial: "+46",  code: "SE" },
  { name: "Switzerland",     dial: "+41",  code: "CH" },
  { name: "Syria",           dial: "+963", code: "SY" },
  { name: "Taiwan",          dial: "+886", code: "TW" },
  { name: "Tajikistan",      dial: "+992", code: "TJ" },
  { name: "Tanzania",        dial: "+255", code: "TZ" },
  { name: "Thailand",        dial: "+66",  code: "TH" },
  { name: "Togo",            dial: "+228", code: "TG" },
  { name: "Tunisia",         dial: "+216", code: "TN" },
  { name: "Turkey",          dial: "+90",  code: "TR" },
  { name: "Turkmenistan",    dial: "+993", code: "TM" },
  { name: "Uganda",          dial: "+256", code: "UG" },
  { name: "Ukraine",         dial: "+380", code: "UA" },
  { name: "United Arab Emirates", dial: "+971", code: "AE" },
  { name: "United Kingdom",  dial: "+44",  code: "GB" },
  { name: "United States",   dial: "+1",   code: "US" },
  { name: "Uruguay",         dial: "+598", code: "UY" },
  { name: "Uzbekistan",      dial: "+998", code: "UZ" },
  { name: "Venezuela",       dial: "+58",  code: "VE" },
  { name: "Vietnam",         dial: "+84",  code: "VN" },
  { name: "Yemen",           dial: "+967", code: "YE" },
  { name: "Zimbabwe",        dial: "+263", code: "ZW" },
];

function phoneDigits(num) {
  return String(num || "").replace(/[\s\-\(\)\+]/g, "");
}

function getCountryByDial(dial) {
  for (var i = 0; i < COUNTRY_CODES.length; i++) {
    if (COUNTRY_CODES[i].dial === dial) return COUNTRY_CODES[i];
  }
  return null;
}

function getPhoneLengths(code) {
  if (typeof PHONE_LENGTHS !== "undefined" && PHONE_LENGTHS[code]) {
    return PHONE_LENGTHS[code];
  }
  return null;
}

function validatePhone(num, countryCode) {
  var digits = phoneDigits(num);
  if (!digits) return false;
  if (!/^\d+$/.test(digits)) return false;

  var country = countryCode ? getCountryByDial(countryCode) : null;
  var lengths = country ? getPhoneLengths(country.code) : null;

  if (lengths && lengths.length) {
    return lengths.indexOf(digits.length) !== -1;
  }
  return /^\d{6,15}$/.test(digits);
}

function phoneLengthHint(countryCode) {
  var country = countryCode ? getCountryByDial(countryCode) : null;
  var lengths = country ? getPhoneLengths(country.code) : null;
  if (!lengths || !lengths.length) return "";

  var singular = lengths.length === 1;
  var text = singular ? "exactly " : "between ";
  text +=
    singular
      ? lengths[0] + " digits"
      : lengths[0] + " and " + lengths[lengths.length - 1] + " digits";
  return country.name + " numbers are " + text + ".";
}

function phoneMaxLength(countryCode) {
  var country = countryCode ? getCountryByDial(countryCode) : null;
  var lengths = country ? getPhoneLengths(country.code) : null;
  if (lengths && lengths.length) {
    return Math.max.apply(null, lengths);
  }
  return 15;
}

function populateCountrySelect(select) {
  COUNTRY_CODES.forEach(function (c) {
    var opt = document.createElement("option");
    opt.value = c.dial;
    opt.textContent = c.name + " " + c.dial;
    if (c.code === "BW") opt.selected = true;
    select.appendChild(opt);
  });
}

function initContactModeToggle() {
  var emailRow = document.getElementById("emailRow");
  var phoneRow = document.getElementById("phoneRow");
  var emailInput = document.getElementById("contact-email");
  var phoneInput = document.getElementById("contact-phone");
  var modeBtns = document.querySelectorAll(".mode-btn");

  modeBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      modeBtns.forEach(function (b) {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");

      var mode = btn.getAttribute("data-mode");
      if (mode === "email") {
        emailRow.classList.remove("hidden");
        phoneRow.classList.add("hidden");
        emailInput.required = true;
        phoneInput.required = false;
      } else {
        emailRow.classList.add("hidden");
        phoneRow.classList.remove("hidden");
        emailInput.required = false;
        phoneInput.required = true;
      }
    });
  });
}

function initContactForm() {
  const mount = document.getElementById("contactFormMount");
  if (!mount) return;

  mount.innerHTML = [
    '<form action="/api/contact" method="POST" id="contactForm">',
    '  <div class="honeypot" aria-hidden="true">',
    '    <input type="text" name="website" tabindex="-1" autocomplete="off" />',
    "  </div>",
    '  <input type="hidden" name="_timestamp" value="' + Date.now() + '" />',
    '',
    '  <div class="contact-mode-toggle" role="radiogroup" aria-label="Contact method">',
    '    <button type="button" class="mode-btn active" data-mode="email" aria-pressed="true">',
    '      <i data-lucide="mail"></i>',
    '      Email',
    '    </button>',
    '    <button type="button" class="mode-btn" data-mode="whatsapp" aria-pressed="false">',
    '      <i data-lucide="phone"></i>',
    '      WhatsApp',
    '    </button>',
    "  </div>",
    '',
    '  <div class="contact-input-row" id="emailRow">',
    '    <input type="email" name="email" id="contact-email" placeholder="Your Email" required />',
    "  </div>",
    '',
    '  <div class="contact-input-row hidden" id="phoneRow">',
    '    <select name="countryCode" id="countryCode" aria-label="Country code"></select>',
    '    <input type="tel" name="phone" id="contact-phone" placeholder="Phone number" />',
    "  </div>",
    '',
    '  <label for="contact-message" class="sr-only">Message</label>',
    '  <textarea name="message" id="contact-message" placeholder="Tell me about your project..." rows="3" required></textarea>',
    '',
    '  <button type="submit" class="contact-btn" id="submitBtn">Send Request</button>',
    '  <div id="formStatus" class="form-status" role="alert" aria-live="polite"></div>',
    "</form>",
  ].join("");

  populateCountrySelect(document.getElementById("countryCode"));
  initContactModeToggle();
  initPhoneFilter();
  attachFormHandler();

  if (window.lucide) {
    lucide.createIcons();
  }
}

function initPhoneFilter() {
  var phoneInput = document.getElementById("contact-phone");
  var countrySelect = document.getElementById("countryCode");
  if (!phoneInput || !countrySelect) return;

  function applyFilter() {
    var maxLen = phoneMaxLength(countrySelect.value);
    var dial = countrySelect.value || "";
    var dash = dial.indexOf("-");
    var ccDigits = phoneDigits(dash === -1 ? dial : dial.slice(0, dash));
    var raw = phoneInput.value.replace(/[^\d]/g, "");

    if (
      ccDigits &&
      raw.length > maxLen &&
      raw.indexOf(ccDigits) === 0
    ) {
      raw = raw.slice(ccDigits.length);
    }

    phoneInput.value = raw.slice(0, maxLen);
    phoneInput.placeholder = "+" + phoneDigits(dial) + " (max " + maxLen + " digits)";
  }

  phoneInput.addEventListener("input", applyFilter);
  countrySelect.addEventListener("change", applyFilter);
  applyFilter();
}

function attachFormHandler() {
  var form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    var message = form.message.value.trim();
    var status = document.getElementById("formStatus");
    var submitBtn = document.getElementById("submitBtn");
    var mode = document.querySelector(".mode-btn.active").getAttribute("data-mode");

    var email, phone, countryCode;
    if (mode === "email") {
      email = form.email.value.trim();
      if (!email) {
        status.textContent = "Please enter your email.";
        status.className = "form-status error";
        return;
      }
    } else {
      phone = form.phone.value.trim();
      countryCode = form.countryCode.value;
      if (!validatePhone(phone, countryCode)) {
        var hint = phoneLengthHint(countryCode);
        status.textContent = hint || "Please enter a valid phone number.";
        status.className = "form-status error";
        return;
      }
    }

    if (!message) {
      status.textContent = "Please enter a message.";
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

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    status.textContent = "";
    status.className = "form-status";

    var body = { message: message, _timestamp: timestamp };
    if (mode === "email") {
      body.email = email;
    } else {
      body.phone = phone;
      body.countryCode = countryCode;
    }

    try {
      var res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      var data = await res.json();

      if (res.ok) {
        status.textContent = "";
        status.className = "form-status";
        submitBtn.textContent = "Request Sent";
        submitBtn.classList.add("sent");
        form.message.value = "";
        if (mode === "email") {
          form.email.value = "";
        } else {
          form.phone.value = "";
        }
        setTimeout(function () {
          submitBtn.textContent = "Send Request";
          submitBtn.classList.remove("sent");
          submitBtn.disabled = false;
        }, 4000);
      } else {
        clientSendFallback(mode, email, phone, countryCode, message, data && data.error);
      }
    } catch (_err) {
      clientSendFallback(mode, email, phone, countryCode, message);
    }
  });
}

function clientSendFallback(mode, email, phone, countryCode, message, reason) {
  var status = document.getElementById("formStatus");
  var submitBtn = document.getElementById("submitBtn");

  var num = (countryCode || "") + " " + (phone || "");
  var body =
    mode === "whatsapp"
      ? "WhatsApp: " + (num.trim() || "No number") + "\n\n" + message
      : "Email: " + (email || "No email") + "\n\n" + message;
  var subject = "CabsCode Project Inquiry";
  if (mode === "whatsapp") subject += " via WhatsApp";

  var href =
    "mailto:bowntema@gmail.com?subject=" +
    encodeURIComponent(subject) +
    "&body=" +
    encodeURIComponent(body);

  window.location.href = href;

  status.textContent = reason
    ? "Server couldn't send it (" + reason + ") — your email app opened instead."
    : "Could not reach the server — your email app opened instead.";
  status.className = "form-status error";

  submitBtn.textContent = "Send Request";
  submitBtn.disabled = false;
}

// --- Service CTA Picker Menus ---
var SERVICE_PICKERS = {
  web: {
    title: "Web Development",
    icon: "code-xml",
    options: [
      { label: "Responsive landing pages", icon: "layout" },
      { label: "Admin dashboards & panels", icon: "gauge" },
      { label: "Single-page applications", icon: "zap" },
      { label: "E-commerce solutions", icon: "shopping-cart" },
    ],
  },
  tools: {
    title: "Custom Tools",
    icon: "wrench",
    options: [
      { label: "Workflow automation", icon: "workflow" },
      { label: "Data visualisation tools", icon: "bar-chart-3" },
      { label: "Internal business utilities", icon: "boxes" },
      { label: "API integrations", icon: "plug" },
    ],
  },
};

function initServicePickers() {
  var buttons = document.querySelectorAll(".service-cta-btn");
  if (!buttons.length) return;

  var grid = document.querySelector(".services-grid");
  var picker = document.getElementById("servicePicker");
  var pickerIcon = document.getElementById("pickerIcon");
  var pickerTitle = document.getElementById("pickerTitle");
  var optionsWrap = document.getElementById("pickerOptions");
  var notes = document.getElementById("pickerNotes");
  var activeCard = null;

  function closePicker() {
    grid.classList.remove("is-picking");
    if (activeCard) activeCard.classList.remove("is-active");
    activeCard = null;
    picker.setAttribute("hidden", "");
  }

  function openPicker(service, card) {
    var data = SERVICE_PICKERS[service];
    if (!data) return;

    activeCard = card;
    pickerIcon.innerHTML = '<i data-lucide="' + data.icon + '"></i>';
    pickerTitle.textContent = data.title;
    notes.value = "";

    optionsWrap.innerHTML = data.options
      .map(function (opt) {
        return (
          '<label class="picker-option">' +
          '<input type="checkbox" value="' +
          opt.label +
          '" />' +
          '<i data-lucide="' +
          opt.icon +
          '"></i>' +
          opt.label +
          "</label>"
        );
      })
      .join("");

    grid.classList.add("is-picking");
    card.classList.add("is-active");
    picker.removeAttribute("hidden");

    if (window.lucide) {
      lucide.createIcons();
    }

    picker.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var service = btn.getAttribute("data-service");
      var card = btn.closest(".service-card");
      if (card.classList.contains("is-active")) {
        closePicker();
      } else {
        openPicker(service, card);
      }
    });
  });

  document.getElementById("pickerClose").addEventListener("click", closePicker);
  document
    .getElementById("pickerCancel")
    .addEventListener("click", closePicker);

  document.getElementById("pickerConfirm").addEventListener("click", function () {
    if (!activeCard) return;

    var service = activeCard
      .querySelector(".service-cta-btn")
      .getAttribute("data-service");
    var data = SERVICE_PICKERS[service];
    var selected = [];
    var checkedBoxes = optionsWrap.querySelectorAll(
      'input[type="checkbox"]:checked',
    );
    for (var i = 0; i < checkedBoxes.length; i++) {
      selected.push(checkedBoxes[i].value);
    }

    var lines = [];
    if (selected.length) {
      lines.push("I'm interested in: " + selected.join(", ") + ".");
    } else {
      lines.push("I'd like to discuss what I need.");
    }
    var extra = notes.value.trim();
    if (extra) {
      lines.push("Details: " + extra);
    }

    var message =
      "Hi Tema, I'd like to enquire about " + data.title + ". " + lines.join(" ");

    var textarea = document.getElementById("contact-message");
    if (textarea) {
      textarea.value = message;
      var form = document.getElementById("contactForm");
      if (form) {
        form.scrollIntoView({ behavior: "smooth", block: "start" });
        textarea.focus();
      }
    }

    closePicker();
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
var copyIcons = {
  clipboard:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M9 12h6"></path><path d="M9 16h4"></path></svg>',
  copied:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>',
  failed:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
};

var codeBlocks = document.querySelectorAll("pre code");
codeBlocks.forEach(function (code) {
  var pre = code.parentElement;
  var btn = document.createElement("button");
  btn.className = "copy-btn";
  btn.setAttribute("aria-label", "Copy code");
  btn.title = "Copy code";
  btn.innerHTML = copyIcons.clipboard;
  pre.appendChild(btn);

  btn.addEventListener("click", function () {
    var text = code.textContent;
    navigator.clipboard
      .writeText(text)
      .then(function () {
        btn.innerHTML = copyIcons.copied;
        btn.classList.add("copied");
        btn.setAttribute("aria-label", "Copied");
        setTimeout(function () {
          btn.innerHTML = copyIcons.clipboard;
          btn.classList.remove("copied");
          btn.setAttribute("aria-label", "Copy code");
        }, 2000);
      })
      .catch(function () {
        btn.innerHTML = copyIcons.failed;
        btn.setAttribute("aria-label", "Copy failed");
        setTimeout(function () {
          btn.innerHTML = copyIcons.clipboard;
          btn.setAttribute("aria-label", "Copy code");
        }, 2000);
      });
  });
});

// --- Websites & Concepts: data-driven demo cards ---
// Add a new demo here (one entry + one screenshot in images/demos/websites/).
var WEBSITE_DEMOS = [
  {
    id: "kwena",
    title: "Kwena Water Works",
    description:
      "A full business site for a Botswana water & filtration company — hero, stats, featured products, services, contact and Google Maps. Built with plain HTML, CSS and JavaScript.",
    tags: [
      { label: "HTML/CSS", cls: "" },
      { label: "JavaScript", cls: "js" },
      { label: "Responsive", cls: "" },
    ],
    badge: "Live",
    badgeClass: "badge-live",
    screenshot: "images/demos/websites/kwena-home.png",
    screenshotAlt: "Kwena Water Works homepage",
    demoUrl: "/demos/kwena/",
    sourceUrl: "https://github.com/CabbageDijon/KwenaWaterWorks",
  },
];

var websitesGrid = document.getElementById("websitesGrid");

if (websitesGrid) {
  WEBSITE_DEMOS.forEach(function (demo) {
    var card = document.createElement("article");
    card.className = "demo-card";

    var tagsHtml = demo.tags
      .map(function (t) {
        return '<span class="tech-tag ' + (t.cls || "") + '">' + t.label + "</span>";
      })
      .join("");

    card.innerHTML =
      '<img src="' +
      demo.screenshot +
      '" alt="' +
      demo.screenshotAlt +
      '" class="demo-image" loading="lazy" />' +
      '<span class="card-badge ' +
      demo.badgeClass +
      '">' +
      demo.badge +
      "</span>" +
      '<div class="demo-content">' +
      '<div class="tech-tags">' +
      tagsHtml +
      "</div>" +
      "<h3>" +
      demo.title +
      "</h3>" +
      "<p>" +
      demo.description +
      "</p>" +
      '<div class="card-actions">' +
      '<a href="' +
      demo.demoUrl +
      '" target="_blank" rel="noopener" class="solid-btn">Visit Site ' +
      '<i data-lucide="external-link" class="icon-inline"></i></a>' +
      '<button type="button" class="solid-btn demo-preview-btn" ' +
      'data-preview-title="' +
      demo.title +
      '" data-preview-url="' +
      demo.demoUrl +
      '">Preview Site</button>' +
      "</div>" +
      "</div>";

    websitesGrid.appendChild(card);
  });

  if (window.lucide) {
    lucide.createIcons();
  }
}

// --- Embedded demo preview modal ---
var previewOverlay = document.getElementById("demoPreviewOverlay");
var previewFrame = document.getElementById("demoPreviewFrame");
var previewTitle = document.getElementById("demoPreviewTitle");
var previewClose = document.getElementById("demoPreviewClose");

function openDemoPreview(title, url) {
  if (!previewOverlay || !previewFrame) return;
  previewTitle.textContent = title;
  if (previewFrame.getAttribute("src") !== url) {
    previewFrame.setAttribute("src", url);
  }
  previewOverlay.classList.add("open");
  previewOverlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("preview-open");
}

function closeDemoPreview() {
  if (!previewOverlay) return;
  previewOverlay.classList.remove("open");
  previewOverlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("preview-open");
  previewFrame.setAttribute("src", "about:blank");
}

if (websitesGrid) {
  websitesGrid.addEventListener("click", function (e) {
    var btn = e.target.closest(".demo-preview-btn");
    if (btn) {
      e.preventDefault();
      openDemoPreview(
        btn.getAttribute("data-preview-title"),
        btn.getAttribute("data-preview-url")
      );
    }
  });
}

if (previewClose) {
  previewClose.addEventListener("click", closeDemoPreview);
}

if (previewOverlay) {
  previewOverlay.addEventListener("click", function (e) {
    if (e.target === previewOverlay) {
      closeDemoPreview();
    }
  });
}

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeDemoPreview();
  }
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

  document.addEventListener("themechange", generateQR);

  function updateWarning() {
    var isMobile = window.innerWidth <= 768;
    var selectedSize = parseInt(sizeSelect.value, 10);
    var warning = card.querySelector("#qr-warning");
    if (isMobile && selectedSize >= 512) {
      warning.classList.add("visible");
    } else {
      warning.classList.remove("visible");
    }
  }

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
  updateWarning();
  sizeSelect.addEventListener("change", updateWarning);
  window.addEventListener("resize", updateWarning);
}
