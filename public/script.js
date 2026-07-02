document.addEventListener("DOMContentLoaded", () => {
  const mobileToggle = document.querySelector(".mobile-toggle");
  const navRight = document.querySelector(".nav-right");

  if (mobileToggle && navRight) {
    mobileToggle.addEventListener("click", () => {
      // Toggles the 'active' class to show/hide the menu on mobile
      navRight.classList.toggle("active");
    });
  }
});
