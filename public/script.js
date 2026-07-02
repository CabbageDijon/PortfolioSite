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
