// Kwena Water Works - Shared JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // Burger menu toggle
  const burger = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');
  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }

  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Handle contact/quote form submission preview if present
  const quoteForm = document.getElementById('contactForm');
  if (quoteForm) {
    quoteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const demoAlert = document.getElementById('demoAlert');
      if (demoAlert) demoAlert.hidden = false;
      quoteForm.reset();
    });
  }

  // Close the demo alert
  const alertClose = document.getElementById('alertClose');
  if (alertClose) {
    alertClose.addEventListener('click', () => {
      const demoAlert = document.getElementById('demoAlert');
      if (demoAlert) demoAlert.hidden = true;
    });
  }
});
