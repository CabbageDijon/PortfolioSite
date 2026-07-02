document.addEventListener("DOMContentLoaded", () => {
  const mobileToggle = document.querySelector(".mobile-toggle");
  const navRight = document.querySelector(".nav-right");

  if (mobileToggle && navRight) {
    mobileToggle.addEventListener("click", () => {
      navRight.classList.toggle("active");
    });
  }
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

  console.log("Script loaded successfully.");

  // Hashless Smooth Scrolling for Contact Links
  // Find all links that point exactly to #contactForm
  const contactLinks = document.querySelectorAll('a[href="#contactForm"]');

  contactLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      // Prevent the browser's default behavior (which adds the # to the URL)
      e.preventDefault();

      // Find the actual form on the page
      const targetElement = document.getElementById("contactForm");

      if (targetElement) {
        // Smoothly scroll down to the form
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        // Optional: If on mobile, close the mobile menu after clicking "Contact"
        if (navRight.classList.contains("active")) {
          navRight.classList.remove("active");
        }
      }
    });
  });
});
