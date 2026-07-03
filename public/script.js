document.addEventListener("DOMContentLoaded", () => {
  // 1. Mobile Menu Toggle Logic
  const mobileToggle = document.querySelector(".mobile-toggle");
  const navRight = document.querySelector(".nav-right");

  if (mobileToggle && navRight) {
    // Toggle the menu when clicking the hamburger icon
    mobileToggle.addEventListener("click", () => {
      navRight.classList.toggle("active");
    });

    // Close the menu when clicking anywhere outside of it
    document.addEventListener("click", (e) => {
      // Only run this check if the menu is actually open
      if (navRight.classList.contains("active")) {
        // Check if the click target is NOT the menu itself AND NOT the toggle button
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
      // Find the parent <li> element
      const parentItem = this.parentElement;

      // Toggle the 'active' class on the parent
      parentItem.classList.toggle("active");
    });
  });
  // --- Mobile Journal Sidebar Drawer Logic ---
  const journalSidebar = document.querySelector(".sidebar");
  const journalToggle = document.getElementById("journalSidebarToggle");

  if (journalToggle && journalSidebar) {
    // 1. Open the sidebar when the white bar is clicked
    journalToggle.addEventListener("click", (e) => {
      e.stopPropagation(); // Stops the document click listener from immediately firing
      journalSidebar.classList.toggle("mobile-open");
    });

    // 2. Close the sidebar if the user scrolls the page
    window.addEventListener(
      "scroll",
      () => {
        if (journalSidebar.classList.contains("mobile-open")) {
          journalSidebar.classList.remove("mobile-open");
        }
      },
      { passive: true },
    );

    // 3. Close the sidebar if the user clicks anywhere outside of it
    document.addEventListener("click", (e) => {
      if (journalSidebar.classList.contains("mobile-open")) {
        // Check if the click happened outside both the sidebar and the toggle button
        if (
          !journalSidebar.contains(e.target) &&
          !journalToggle.contains(e.target)
        ) {
          journalSidebar.classList.remove("mobile-open");
        }
      }
    });
  }

  // 2. Hashless Smooth Scrolling for Contact Links
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

        // Close the mobile menu after clicking "Contact"
        if (navRight && navRight.classList.contains("active")) {
          navRight.classList.remove("active");
        }
      }
    });
  });
});
