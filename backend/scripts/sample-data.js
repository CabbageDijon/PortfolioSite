// Sample submissions used by preview-emails.js and send-test.js.
const quote = {
  siteType: "Business Website",
  pages: 5,
  extraPages: 2,
  pagePrice: 2400,
  quoteOnly: false,
  addons: [
    { label: "Contact form with WhatsApp button", price: 300 },
    { label: "Google Business Profile setup", price: 250 },
  ],
  monthly: [
    { label: "Hosting & SSL", price: 120, per: "month" },
    { label: "Care plan (updates & backups)", price: 200, per: "month" },
  ],
  oneTimeTotal: 2950,
  monthlyRecurring: 320,
  notes: "We'd like a gallery for our past projects and a Setswana version later.",
};

const samples = {
  "inquiry-email": {
    email: "client@example.com",
    phone: "",
    countryCode: "",
    service: "Web App",
    message: "Hi! I run a small logistics company in Gaborone and need a booking system for deliveries.\nCan we chat this week?",
    quote: null,
  },
  "inquiry-whatsapp": {
    email: "",
    phone: "71234567",
    countryCode: "+267",
    service: "Website",
    message: "Looking for a simple website for my salon <with prices & booking>.",
    quote: null,
  },
  "quote-email": {
    email: "client@example.com",
    phone: "",
    countryCode: "",
    service: "",
    message: "Website quote request — see attached summary.",
    quote: quote,
  },
  "quote-custom": {
    email: "client@example.com",
    phone: "71234567",
    countryCode: "+267",
    service: "",
    message: "Custom e-commerce quote request.",
    quote: Object.assign({}, quote, { siteType: "E-commerce Store", quoteOnly: true, addons: [], monthly: [], monthlyRecurring: 0 }),
  },
};

module.exports = { samples: samples, quote: quote };
