# CabsCode — Demo Plans for Each Website Tier

Four demo sites, one per tier on the Services page price estimator (`QUOTE_TIERS` in `public/script.js`). Each demo is a fictional Botswana business so the tier's promise is visible, not just described. Every demo has a distinct art direction so the four don't look like one template in four colourways.

---

## Shared rules (all four demos)

- **Mobile first.** Every tier already promises a mobile bar, WhatsApp and tap-to-call. The mobile view is the primary design, not an afterthought.
- **Auto theme.** Follow the device light/dark preference (TODO: "auto theming to device"). Each demo gets its own light and dark palette, not an inverted copy.
- **Speed.** Compress images to WebP, lazy-load everything below the fold, no heavy frameworks. Target a fast first paint on mobile data.
- **Setswana touch.** A short "Dumela / Hello" greeting where the tier includes the language switch.
- **Real-feeling copy.** Local place names (Main Mall, Block 6/8, Broadhurst, Fairgrounds, CBD, Industrial) so the demos read as Gaborone businesses.
- **Folder layout.** `public/demos/tier-base/`, `tier-standard/`, `tier-advanced/`, `tier-ecommerce/`, matching the existing `public/demos/kwena/` pattern.

---

## Demo 1 — Base Site ("Get Found Fast")

**Price band:** P600–P800 · **Pages:** 1–3 · **Revisions:** 1 round · **Go-live:** about 7 days

**Fictional client:** *Tumelo Phone Fix* — a one-person phone repair stall on Main Mall, Gaborone.

**Art direction: "Sticker shop."** A loud, friendly, flat-colour look built from stickers, chunky badges and hard offset shadows. It stands out on a phone screen in a sea of grey, clean sites. Inspiration: the bold-typography and "bold minimalism" direction from 2026 trend guides, applied with a playful twist (a "Cute-alism" trend noted by Vistaprint for small businesses).

- Palette: one hot accent (tangerine), off-white paper, near-black ink. Dark mode swaps to deep ink with the accent kept.
- Type: one oversized display face for the headline, a simple sans for body copy. Keep body text small so the big headline carries the design.
- Motifs: a "Open now" sticker that flips to "Closed" automatically, a repair-ticket card for prices, a QR code printed like a stamp.

**Pages**
1. Home — hero headline, sticker "Open now" badge, prices-at-a-glance card, big call/WhatsApp buttons, map pin.
2. Services & prices — simple list of repairs with fixed-price cards.
3. Find us — address, directions button, opening hours, "Save my contact" button.

**Tier features to show**
- Mobile bar: tap-to-call, WhatsApp, directions (sticky at bottom)
- Rich link previews on WhatsApp and Facebook (OG tags on every page)
- Automatic Open/Closed badge
- Google setup: sitemap and business details
- QR code pack for counter and flyers (printed mock-up in the demo)
- "Save my contact" button

**Done when:** the page loads in under two seconds on mobile data, the sticker badge flips correctly by time of day, and a WhatsApp share preview shows the business name and photo.

---

## Demo 2 — Standard Site ("Look Established") — *Most popular tier*

**Price band:** P2,000–P2,200 · **Pages:** 4–6 · **Revisions:** 2 rounds

**Fictional client:** *Kopano Barber Co.* — a barbershop in Block 8, Gaborone, with a small team and a busy weekend book.

**Art direction: "Editorial barbershop."** Magazine-style layout: one large headline, one short paragraph, one strong photo per section. This is the layout the design trend commentary calls "editorial-first hierarchy" (one headline, one paragraph, one image, and room to breathe). Warm, confident, credible.

- Palette: deep green, warm ochre and cream. Dark mode uses forest-black with ochre accents.
- Type: a high-contrast serif for headings and a clean grotesque for body, with generous line spacing.
- Motifs: before/after photo slider with a diagonal divider, star-rating strip pulled from reviews, a "Book a chair" calendar block.
- Pattern: thin rules and numbered section markers (01 / 02 / 03) for an editorial feel.

**Pages**
1. Home — editorial hero, review strip, featured services, booking block.
2. Services & pricing — two-column price table, duration per cut.
3. Gallery — before/after grid with the slider.
4. Book — simple calendar embed, WhatsApp fallback button.
5. About & team — short bios with photos.
6. Contact & FAQ — FAQ shown as accordion (also marked up for Google).

**Tier features to show**
- Google Reviews + star rating (strip under hero)
- FAQ section marked up so it can appear on Google
- Photo gallery with before/after
- Lite speed boost for images (WebP, lazy-load)
- Simple booking calendar (free)
- Instagram feed lite (a grid of the last six posts)
- WhatsApp chat widget (free)
- Google titles and descriptions (free)

**Done when:** the before/after slider works by touch on a phone, the review strip shows live star data (or a cached sample in the demo), and the FAQ validates as structured data.

---

## Demo 3 — Advanced Site ("Grow Without Rebuild")

**Price band:** P3,400–P3,900 · **Pages:** 7–12 · **Revisions:** 2 rounds

**Fictional client:** *Sebego & Partners Attorneys* — a small commercial and property practice in the CBD, Gaborone.

**Art direction: "Calm authority, plain language."** Cream paper, a serif headline, and a clear practice-area index. The brief is trust first: a first-time client should understand what the firm does in seconds. A law-firm conversion guide frames the single goal as getting the visitor to book a consultation, so every page has one clear "Book a consultation" action. Plain-language copy is central, because the audience is often new to legal services.

- Palette: warm paper, deep navy ink, one muted brass accent. Dark mode is navy with brass kept.
- Type: a refined serif for display, a neutral sans for body. Large numerals for practice areas.
- Motifs: a practice-area index (one row per area with an arrow), an announcement bar at top, a "Dumela / Hello" language toggle in the header, a short "What it costs" explainer page.

**Pages**
1. Home — headline, one-line promise, practice-area index, consultation CTA.
2. Practice areas — index page plus one page per area (about 4 pages).
3. Team — partner bios with photos and qualifications.
4. Insights — news posts list, with a sample post that the client can edit.
5. FAQ and "What it costs" — plain-language fees explainer.
6. Newsletter sign-up — dedicated page with confirmation.
7. Contact — enquiry form that sends the lead to WhatsApp.

**Tier features to show**
- Edit the blog and portfolio yourself (CMS or markdown admin, per the Blog add-on notes)
- Enquiry form sends leads to WhatsApp
- "Dumela / Hello" greeting switch
- Site search and newsletter signup
- Announcement bar the client controls
- Google visitor stats connected (free), shown as a set-up note
- Publish news posts yourself (free)

**Done when:** the client can add a news post and an announcement without a developer (demonstrated in a short screen recording), and the practice-area pages each have a single, identical consultation CTA.

---

## Demo 4 — E-commerce Site ("Sell While You Sleep") — *Quote-only tier*

**Price band:** custom quote · **Pages:** store (product catalogue, cart, checkout)

**Fictional client:** *Tlou Coffee Roasters* — a small-batch roaster in Gaborone selling bags, filter sets and gift boxes online.

**Art direction: "Bold product-first."** Bright, saturated colour and product photography do the selling. Recent ecommerce guides point to image-led category filtering, quick-add buttons and playful but clear design, as used by fashion and beauty brands. The demo borrows those patterns at a smaller, more personal scale.

- Palette: roasted-brown ink, a saturated coffee-cherry red, and a fresh mint for "in stock". Dark mode is espresso-black with the red kept.
- Type: a chunky display face for product names, a clean sans for prices and details.
- Motifs: image-led filter bar (by roast, by use, by gift), quick-add on product cards, stock-level badges, a "How to pay" page for mobile money.

**Pages**
1. Home — hero product, category tiles, gift-finder block.
2. Shop / category — image-led filters, quick-add, stock badges.
3. Product page — gallery, roast notes, add-to-cart, delivery info.
4. Cart and checkout — three steps, mobile-money instructions, guest checkout.
5. How to pay — mobile money (lite instructions page).
6. About — short story and sourcing.

**Tier features to show**
- Store with cart, checkout and stock alerts
- Mobile-money how-to-pay page (lite)
- WhatsApp reminder for abandoned carts
- Add-to-Home-Screen app feel (Android)
- Data-saver mode for buyers on mobile data (small images, no autoplay)

**Note:** this tier is quote-only in the estimator, so the demo should carry a "Custom quote" badge. The demo shows the look and feel only; it does not take real payments.

**Done when:** a visitor can add two products, see the stock badge change, and reach the mobile-money page, all on a mid-range Android phone at mobile-data speed.

---

## Build order

1. **Base** — smallest, proves the mobile-first and sticker system. Reuse its header/footer and mobile bar across the other demos.
2. **Standard** — adds reviews, gallery and booking. Establishes the editorial type system.
3. **Advanced** — adds the CMS, language switch and search. Biggest content load.
4. **E-commerce** — last, because it needs the most UI (cart, filters, checkout states).

---

## Sources for design direction

- Vistaprint, web design trends (playful "Cute-alism" direction for small businesses): https://www.vistaprint.ca/hub/web-design-trends
- Barn Images, 8 web design trends for 2026 (bold editorial typography): https://barnimages.com/blog/tips/web-design-trends/
- Tvisha, website design trends for 2026 (bold minimalism): https://www.tvisha.com/blog/website-design-trends
- Credo Digital, state of web design 2026 (editorial-first hierarchy): https://credo-digital.com/blog/state-of-web-design-2026
- Nexter, web design trends 2026 (bold colour, oversized type, radical brevity): https://nexterwp.com/blog/web-design-trends/
- Elementor, small business website examples 2026: https://elementor.com/blog/small-business-website-examples/
- Limely, best ecommerce website designs of 2026 (image-led filtering, quick-add): https://www.limely.co.uk/blog/the-best-ecommerce-website-designs
- OptiMonk, 37 ecommerce web design examples 2026: https://www.optimonk.com/ecommerce-web-design-examples
- Hostinger, ecommerce website examples 2026: https://www.hostinger.com/ng/tutorials/?p=25894
- KrishaWeb, 14 best legal website designs for 2026 (conversion goal and plain language): https://www.krishaweb.com/blog/best-legal-website-design-examples/
- Clio, top 20 law firm websites 2026: https://www.clio.com/?p=17577
- Paper Street, 2026 law firm website design trends: https://www.paperstreet.com/blog/2026-law-firm-website-design-trends/
