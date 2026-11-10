# [BRAND_NAME] — Pre-Order Website: Product Requirements Document (PRD)

Version 1.0 · 2026-11-06 · Owner: Ahmed Kamal

---

## 0. Instructions for the coding agent (read first)

1. Read this whole document before writing any code.
2. Build in the phases listed in section 14, **one phase at a time**. After each phase, stop, run the site locally, and give me a short summary: what works, how to run it, how to test it by hand.
3. Do **not** add features that are not in this document. Section 3 lists what is out of scope.
4. If something is ambiguous, choose the simplest option that satisfies the requirement and record the assumption in `README.md` under "Assumptions".
5. Everything the owner needs to edit (WhatsApp number, prices, product list, links, tracking IDs) lives in **`config.js`** and **`products.json`**. The owner is technical but does not want to touch the main code to change content.
6. The finished site must deploy as **static files only** on a **free** host, with **no paid service and no credit card**. See section 10.
7. Arabic (right-to-left) is the default language. English is a toggle.
8. Never invent facts about the products or business (certifications, "organic", health benefits, licence numbers, shelf life). Use only what is in `config.js` / `products.json`, otherwise leave it out.

---

## 1. Product summary

A mobile-first, Arabic-first, one-page website where visitors discover traditional Egyptian farm foods made by village farmers near Tanta (Gharbia) and send a **pre-order request**. There is **no online payment**. Payment is cash on delivery, and the owner confirms each order by WhatsApp.

Products at launch (editable in `products.json`):
- Breads: Aish Rahaly (عيش رحالي), Koras (قرص), Feteer Meshaltet (فطير مشلتت)
- Dairy: Qareesh cheese (جبنة قريش), Fallahy butter (زبدة فلاحي)

**The site's real job is to measure demand** before the owner spends money on stock, a bakery or a factory. Every design decision should make the funnel measurable (section 8).

Business context: the owner is an intermediary who connects city customers with farmers who still make these foods, and delivers by hand to start with. First target areas are Tanta and Gharbia, then Alexandria and Cairo.

---

## 2. Goals and success metrics

**Primary goal:** count how many people move through this funnel.

| Stage | Meaning | Tracked event |
|---|---|---|
| 1. Visit | Arrived from a post, video or ad | `page_view` (with UTM source) |
| 2. Interest | Opened or tapped a product | `view_product` |
| 3. Intent | Added something to the order | `add_to_order` |
| 4. Commitment | Submitted the order form | `submit_order` |
| 5. Confirmation | Tapped "Confirm on WhatsApp" | `click_whatsapp_confirm` |

The owner sets the success thresholds, not the site. The site only has to make these numbers easy to read, per traffic source (section 8).

**Non-goals:** selling online, collecting payments, building a community, SEO growth.

---

## 3. Scope

**In scope:** one-page site, product catalog from `products.json`, order cart, order form, waitlist for "coming soon" products, Arabic/English, analytics and UTM tracking, order storage in Google Sheets, WhatsApp confirmation, privacy page, free deployment guide.

**Out of scope (do not build):** online payment, user accounts or login, a native or mobile app, an admin dashboard (the owner uses Google Sheets), inventory management, delivery tracking, product reviews, blog, multiple vendors, any paid service.

---

## 4. Users and context

- **Primary users:** Egyptian adults, about 25–55, in Tanta, Alexandria, Cairo and Giza, who want authentic baladi bread and dairy.
- They arrive from Facebook, Instagram or TikTok, usually on mid-range Android phones, often inside the **in-app browser**, often on slow mobile data.
- **Design implications:** mobile-first (360 px width is the baseline), light pages, large tap targets, Arabic typography done properly, no popups that in-app browsers block.

---

## 5. Brand, tone and content rules

- Brand name is a placeholder: `[BRAND_NAME]`, read from `config.js`. Logo is a text wordmark for now.
- **Tone:** warm, honest, clean. Rural and authentic without cheap folklore clichés.
- **Colour direction** (agent may refine): warm cream background, wheat gold, deep olive green, terracotta accent. Text must meet WCAG AA contrast.
- **Fonts:** Arabic-friendly (Cairo or Tajawal), self-hosted if possible. Maximum 2 font families.
- **Photos:** until real photos exist, use neutral placeholders that are clearly labelled "sample photo". **Never use stock photos that imply they are the real products.**
- **Honesty rules:**
  - Always label ordering as **"Pre-order"**, with "No payment now, pay on delivery".
  - Do not claim "organic", "certified", "licensed", or any health benefit.
  - Show a food-safety licence number in the footer **only if** `config.licenseNumber` is not empty.
- Arabic marketing copy uses Egyptian dialect. Legal and privacy text uses Modern Standard Arabic.
- Starter strings are in Appendix A. They are drafts for the owner to review.

---

## 6. Functional requirements

**FR-1 Header.** Logo, anchor links (Products, How it works, Farmers, FAQ), AR/EN toggle, a sticky "Pre-order" button, and a floating WhatsApp button (`wa.me` link from config).

**FR-2 Hero.** Headline, one-line subhead, primary CTA "Pre-order now" that scrolls to products, and three trust chips (editable in the i18n files).

**FR-3 How it works.** Three steps: choose, we confirm on WhatsApp, delivery from the farm on the delivery day. Pay on delivery.

**FR-4 Product catalog.** Rendered from `products.json`.
- Card: image, name, short description, unit and price (if `price_egp` is null, show "Price confirmed on order"), availability badge (`available`, `coming_soon`, `sold_out`), quantity stepper and an "Add to order" button.
- Tapping the card opens a detail modal: long description, storage note, origin (village / farmer first name), minimum order.
- Quantities may be decimal (for example 0.5 kg), so honour `min_qty` and `step`.
- `coming_soon` products show a "Notify me" button instead (FR-8). `sold_out` products are not orderable.

**FR-5 Order summary.** A sticky bottom bar on mobile showing item count and estimated total. The total is shown only when every selected item has a price. A "Continue" button opens the form (FR-6). The cart can be edited (change quantity, remove). Persist the cart in `sessionStorage`, wrapped in try/catch, and the page must still work if storage fails.

**FR-6 Order form.** Fields:

| Field | Rules |
|---|---|
| Full name | required, 2–60 characters |
| Mobile | required; Egyptian mobile format `01[0125]XXXXXXXX`; accept Arabic-Indic digits and convert them |
| Governorate | select: Gharbia, Alexandria, Cairo, Giza, Other (list comes from config) |
| City / area | required text |
| Address details | required, 5–200 characters |
| Preferred delivery day | select from `config.deliveryDays`, plus "Any day" |
| Notes | optional, max 300 characters |
| Consent | required checkbox linking to the privacy page |
| Hidden: honeypot | field named `website`; if filled, silently drop the submission |
| Hidden: context | UTM parameters, referrer, language, device type, timestamp |

If the chosen governorate is not in `config.deliveryAreas`, **still accept the order** and flag it `in_delivery_area = FALSE`. This is useful demand data for planning expansion. Show a polite message that delivery there is not available yet and the owner will contact them.

**FR-7 Submission and WhatsApp confirmation.**
- Generate an order ID on the client: `ORD-YYMMDD-XXXX` (4 random characters).
- POST the order to the Apps Script endpoint (section 7). Use `Content-Type: text/plain;charset=utf-8` with a JSON body to avoid a CORS preflight.
- Treat any non-network-error response as sent.
- Show a thank-you screen with the order ID, order summary, and a large **"Confirm on WhatsApp"** button. It opens `wa.me/<number>?text=<prefilled Arabic message with order ID and items>`. Fire `click_whatsapp_confirm` on tap.
- **Resilience:** if the POST fails or times out (10 s), show the same WhatsApp button with the full order details in the message, so no order is ever lost.
- Block double submission (disable the button while sending, and throttle to one submission per 30 s).

**FR-8 Waitlist.** "Notify me" for `coming_soon` products: name and mobile only. Saved to the same sheet with `type = waitlist`.

**FR-9 Farmers / story section.** 2–3 cards (placeholder photo, first name, village, one line). Content comes from `config.js`; hide the section if empty.

**FR-10 FAQ.** Accordion, content from the i18n files. Topics: delivery areas and days, payment, freshness and storage, how to contact, what "pre-order" means.

**FR-11 Footer.** WhatsApp link, Facebook / Instagram / TikTok links (shown only if set in config), privacy link, licence number (only if set), copyright.

**FR-12 Privacy page.** `privacy.html` in Arabic with an English toggle. It lists what is collected (name, phone, address, order contents), why (to deliver and contact), how long it is kept, how to ask for deletion (contact from config), and states that data is not sold. The owner should verify what applies under Egyptian personal-data rules.

**FR-13 Language.** All visible strings live in `i18n/ar.json` and `i18n/en.json`. Switching language sets `lang` and `dir` on `<html>`, updates the page without a reload, and remembers the choice (localStorage in try/catch). Default is Arabic.

**FR-14 Sharing.** Open Graph and Twitter meta tags, a 1200×630 OG image placeholder, favicon, and an Arabic meta description, so links look good when shared on Facebook and WhatsApp.

---

## 7. Data, configuration and storage

### 7.1 `config.js` (owner-editable)

```js
window.SITE_CONFIG = {
  brandName: "[BRAND_NAME]",
  whatsappNumber: "20XXXXXXXXXX",   // international format, digits only, no +
  appsScriptUrl: "",                // filled after deploying the Apps Script (see DEPLOY.md)
  ga4MeasurementId: "",             // e.g. G-XXXXXXXXXX; leave empty to disable
  metaPixelId: "",                  // optional; leave empty to disable
  facebookUrl: "",
  instagramUrl: "",
  tiktokUrl: "",
  licenseNumber: "",                // show in footer only if not empty
  privacyContact: "",               // WhatsApp or email for data deletion requests
  currency: "EGP",
  deliveryAreas: ["Gharbia", "Alexandria", "Cairo", "Giza"],
  deliveryDays: ["Thursday", "Friday"],
  farmers: []                       // [{ name:{ar,en}, village:{ar,en}, line:{ar,en}, image:"" }]
};
```

### 7.2 `products.json` (owner-editable)

Prices are `null` on purpose. The owner fills them in later. Arabic names and descriptions are drafts for the owner to review.

```json
{
  "products": [
    {
      "id": "aish-rahaly",
      "category": "bread",
      "name": { "ar": "عيش رحالي", "en": "Aish Rahaly" },
      "description": { "ar": "عيش رحالي بلدي من أيدي فلاحين القرية.", "en": "Traditional rahaly bread made by village farmers." },
      "unit": { "ar": "رغيف", "en": "loaf" },
      "price_egp": null,
      "min_qty": 1,
      "step": 1,
      "availability": "available",
      "origin": { "ar": "", "en": "" },
      "storage": { "ar": "", "en": "" },
      "image": "images/placeholder-bread.webp"
    },
    {
      "id": "koras",
      "category": "bread",
      "name": { "ar": "قرص", "en": "Koras" },
      "description": { "ar": "قرص بلدي من أيدي فلاحين القرية.", "en": "Traditional koras bread made by village farmers." },
      "unit": { "ar": "قطعة", "en": "piece" },
      "price_egp": null,
      "min_qty": 1,
      "step": 1,
      "availability": "available",
      "origin": { "ar": "", "en": "" },
      "storage": { "ar": "", "en": "" },
      "image": "images/placeholder-bread.webp"
    },
    {
      "id": "feteer-meshaltet",
      "category": "bread",
      "name": { "ar": "فطير مشلتت", "en": "Feteer Meshaltet" },
      "description": { "ar": "فطير مشلتت فلاحي بطبقات هشّة.", "en": "Layered, flaky farm-style feteer meshaltet." },
      "unit": { "ar": "قطعة", "en": "piece" },
      "price_egp": null,
      "min_qty": 1,
      "step": 1,
      "availability": "coming_soon",
      "origin": { "ar": "", "en": "" },
      "storage": { "ar": "", "en": "" },
      "image": "images/placeholder-bread.webp"
    },
    {
      "id": "qareesh",
      "category": "dairy",
      "name": { "ar": "جبنة قريش", "en": "Qareesh Cheese" },
      "description": { "ar": "جبنة قريش بلدي من لبن القرية.", "en": "Village-made qareesh cheese." },
      "unit": { "ar": "كيلو", "en": "kg" },
      "price_egp": null,
      "min_qty": 0.5,
      "step": 0.5,
      "availability": "available",
      "origin": { "ar": "", "en": "" },
      "storage": { "ar": "", "en": "" },
      "image": "images/placeholder-dairy.webp"
    },
    {
      "id": "fallahy-butter",
      "category": "dairy",
      "name": { "ar": "زبدة فلاحي", "en": "Fallahy Butter" },
      "description": { "ar": "زبدة فلاحي بلدي.", "en": "Traditional farm butter." },
      "unit": { "ar": "كيلو", "en": "kg" },
      "price_egp": null,
      "min_qty": 0.25,
      "step": 0.25,
      "availability": "available",
      "origin": { "ar": "", "en": "" },
      "storage": { "ar": "", "en": "" },
      "image": "images/placeholder-dairy.webp"
    }
  ]
}
```

Rules: an empty `origin` or `storage` hides that line in the modal. Adding a product to this file must be enough to make it appear, with no code changes.

### 7.3 Order storage: Google Apps Script + Google Sheets (free)

The site has no server. It posts to a **Google Apps Script web app** (code in `apps-script/Code.gs`) that appends rows to a Google Sheet owned by the owner.

**Sheet `Orders` columns:** `timestamp`, `order_id`, `type` (`order` | `waitlist`), `status` (default `new`; the owner edits to `confirmed` / `delivered` / `cancelled`), `name`, `phone`, `governorate`, `area`, `address`, `delivery_day`, `notes`, `items_json`, `items_summary`, `est_total`, `in_delivery_area`, `lang`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `referrer`, `device`, `consent`.

**Sheet `Events` columns:** `timestamp`, `session_id`, `event`, `product_id`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `lang`, `device`.

**`Code.gs` requirements:**
- `doPost(e)` parses a JSON body and routes on `type`: `order`, `waitlist`, `event`.
- Server-side validation: required fields, length limits, phone format, allowed `type` values. Reject anything else.
- **Spreadsheet formula-injection defence:** if a text value starts with `=`, `+`, `-` or `@`, prefix it with an apostrophe before writing.
- Use `LockService` to avoid concurrent write problems.
- Drop honeypot submissions. Dedupe: ignore an identical phone + items submission within 10 minutes.
- Optional: email the owner on each new order using `MailApp` (a config flag at the top of the script).
- `doGet()` returns only a plain "ok". It must **never** return sheet data.
- Return JSON `{ ok: true }` or `{ ok: false, error: "..." }`.

---

## 8. Analytics and tracking (core feature)

**Tools:** Google Analytics 4 (free), loaded **only if** `ga4MeasurementId` is set. Meta Pixel is optional and loaded only if `metaPixelId` is set. No other third-party scripts.

**UTM handling:** on first load, read `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` from the URL, store them in `sessionStorage` (try/catch), and attach them to every event and to the order. The README must document the link format, for example:
`https://SITE/?utm_source=facebook&utm_medium=video&utm_campaign=launch1&utm_content=reel1`

**Events** (send to GA4 and, if enabled, the first-party `Events` sheet):

| Event | When | Parameters |
|---|---|---|
| `page_view` | page load | utm_*, lang, device |
| `view_product` | product modal opened | product_id |
| `add_to_order` | item added | product_id, qty |
| `begin_order` | order form opened | item_count |
| `submit_order` | order accepted by the form | order_id, item_count, est_total |
| `click_whatsapp_confirm` | confirm button tapped | order_id |
| `click_whatsapp_general` | floating WhatsApp button tapped | none |
| `join_waitlist` | waitlist form submitted | product_id |
| `language_toggle` | language changed | lang |

**First-party event log (required):** also send the events above to the Apps Script `Events` sheet using `navigator.sendBeacon` or `fetch` with `keepalive`. Reason: ad blockers and in-app browsers often block GA, and the owner needs trustworthy counts. Use a random `session_id` per visit. Throttle so one session cannot send more than 50 events. Never block the UI on tracking.

**Privacy:** never send name, phone or address to GA4 or Meta. Order contents and IDs only.

**Funnel report:** produce `docs/analytics-guide.md` explaining how to read the funnel per `utm_source`, with ready-to-paste Google Sheets formulas (`COUNTIFS`) for a `Funnel` tab: counts per event, conversion rate between each stage, and a breakdown by `utm_source` and `utm_campaign`.

---

## 9. Non-functional requirements

**Performance:** Lighthouse mobile score at least 90 for Performance. Initial page weight under about 1 MB excluding lazy-loaded images. Images in WebP with explicit width and height, lazy-loaded. No layout shift. Usable on slow 3G.

**Compatibility:** last 2 versions of Chrome, Safari and Samsung Internet; Android 8+ WebView; works inside Facebook and Instagram in-app browsers. If JavaScript fails, show a plain WhatsApp link as a fallback.

**Accessibility:** semantic HTML, Accessibility score at least 95, visible focus states, AA contrast, tap targets at least 44 px, labels and `aria` text in both languages, correct RTL layout and numerals.

**Security:**
- HTTPS only (provided by the host).
- Render user-supplied text with `textContent`, never `innerHTML`.
- Add a `_headers` file (supported by Cloudflare Pages and Netlify) with a strict Content-Security-Policy that allows only self, Google Apps Script, and Google Analytics / Meta Pixel when enabled. Also set `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin`.
- Self-host libraries and fonts. If any CDN script is unavoidable, pin the version and use Subresource Integrity.
- No secrets in client code. The Apps Script URL is public by design, so the script must validate everything and expose nothing (section 7.3).
- Honeypot, client throttle, and server-side dedupe against spam.
- Collect only the fields listed in section 6.

**SEO basics:** Arabic `<title>` and meta description, `lang` and `dir`, `robots.txt`, `sitemap.xml`.

---

## 10. Hosting and deployment (free only)

- **Frontend:** static files hosted free on **Cloudflare Pages** (recommended). Alternatives: Netlify, GitHub Pages, Firebase Hosting. The agent must not rely on any feature that exists on only one host, except the optional `_headers` file.
- **Backend:** Google Apps Script + Google Sheets, free with a normal Google account.
- No paid service, no credit card. A free subdomain (for example `name.pages.dev`) is fine for launch. A custom domain is optional later.
- Free-tier limits change, so `DEPLOY.md` must tell the owner to check the current limits on the host and on Apps Script quotas before launch.

**The agent must produce `DEPLOY.md` with click-by-click steps for:**
1. Creating the Google Sheet and its two tabs, pasting `Code.gs` into Apps Script, and deploying it as a web app (Execute as: Me; Who has access: Anyone). Then copying the URL into `config.js`.
2. Creating a GA4 property and pasting the measurement ID into `config.js`.
3. Deploying to Cloudflare Pages, plus one alternative host.
4. A final test checklist (section 13).

The agent cannot access the owner's Google or hosting accounts. It writes the code and instructions, and the owner performs the deployment steps.

---

## 11. Suggested tech stack

- Plain **HTML + CSS + vanilla JavaScript** (ES modules), optionally with Vite for local dev. No React, no backend framework, no database.
- Local run: `npx serve` or `python -m http.server`. No complicated build step.
- The agent may choose a different approach only if the output is still plain static files and stays editable through `config.js` and `products.json`.

---

## 12. Suggested file structure

```
/
├─ index.html
├─ privacy.html
├─ config.js
├─ products.json
├─ i18n/
│  ├─ ar.json
│  └─ en.json
├─ css/styles.css
├─ js/
│  ├─ main.js
│  ├─ i18n.js
│  ├─ catalog.js
│  ├─ cart.js
│  ├─ form.js
│  └─ track.js
├─ images/              (placeholders, clearly labelled)
├─ apps-script/Code.gs
├─ docs/analytics-guide.md
├─ _headers
├─ robots.txt
├─ sitemap.xml
├─ README.md
└─ DEPLOY.md
```

---

## 13. Acceptance criteria

The build is accepted when all of these pass:

1. The site renders in Arabic RTL by default on a 360 px viewport with no horizontal scroll, and the English toggle switches text and direction without a reload.
2. All five sample products render from `products.json`. Editing the file (name, price, availability) changes the page without touching other code.
3. A `null` price shows "Price confirmed on order" and no total. When all prices are set, the estimated total is correct, including decimal quantities.
4. A `coming_soon` product shows "Notify me", and a waitlist submission creates a `waitlist` row.
5. The order form rejects invalid phone numbers, empty required fields and an unticked consent box, and accepts Arabic-Indic digits.
6. A valid order creates one row in `Orders` with correct UTM values, and shows the thank-you screen with a working prefilled WhatsApp link.
7. With `appsScriptUrl` empty or the network off, the order flow still ends with the WhatsApp fallback containing the full order.
8. A filled honeypot field creates no row. A repeat submission within 10 minutes is ignored. A name starting with `=` is stored as plain text, not as a formula.
9. Each event in section 8 appears in the `Events` sheet with the right UTM source, and in GA4 when an ID is set. Leaving the GA4 ID empty loads no Google scripts.
10. No name, phone or address is sent to GA4 or Meta.
11. Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95.
12. The site works inside the Facebook in-app browser on a real Android phone.
13. Pasting the site link into WhatsApp or Facebook shows the correct title, description and image.
14. `README.md`, `DEPLOY.md` and `docs/analytics-guide.md` exist, and following `DEPLOY.md` alone produces a working live site.

---

## 14. Build phases

| Phase | Deliverable |
|---|---|
| 1 | Static site: layout, theme, i18n, product catalog from `products.json`, FAQ, responsive and RTL correct |
| 2 | Cart, order form, validation, Apps Script, Sheet storage, WhatsApp confirmation and fallback, waitlist |
| 3 | UTM capture, GA4 and optional Meta Pixel, first-party events, funnel guide and formulas |
| 4 | Performance, accessibility, security headers, OG tags, privacy page, spam protection |
| 5 | `README.md`, `DEPLOY.md`, final test run against section 13 |

After each phase the agent stops, summarises, and lists how to test it.

---

## 15. What the owner must supply

Brand name and logo, WhatsApp number, prices, real product photos (once samples arrive), delivery areas and days, farmer details, social links, licence number (only if one exists), privacy contact, and a review of all Arabic text.

---

## Appendix A — Starter copy (drafts for the owner to review)

| Key | Arabic | English |
|---|---|---|
| Hero headline | عيش وجبنة وزبدة فلاحي… زي ما كانت جدتك بتعملها | Farm bread, cheese and butter, the way they used to be made |
| Hero subhead | من أيدي فلاحين قرى الغربية لحد باب بيتك. احجز طلبك دلوقتي والدفع عند الاستلام. | From the hands of village farmers in Gharbia to your door. Pre-order now, pay on delivery. |
| Primary CTA | احجز طلبك | Pre-order now |
| Trust chips | من الفلاح للبيت · الدفع عند الاستلام · حجز مسبق، لا دفع الآن | From the farmer to your home · Pay on delivery · Pre-order, no payment now |
| Step 1 | اختار اللي نفسك فيه | Choose what you want |
| Step 2 | هنكلمك على واتساب نأكد الطلب | We confirm your order on WhatsApp |
| Step 3 | بنوصلهولك في ميعاد التوصيل | We deliver on the delivery day |
| Success title | تم استلام طلبك! | We received your order! |
| Success body | اضغط الزر لتأكيد الطلب على واتساب. | Tap the button to confirm your order on WhatsApp. |
| Fallback | لو حصلت مشكلة، ابعتلنا الطلب على واتساب مباشرة. | If something went wrong, send us your order on WhatsApp directly. |
