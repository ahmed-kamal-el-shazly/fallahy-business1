# Fallahy — Pre-Order Demand Feasibility Website

A lightweight, mobile-first, Arabic-first website built to test and validate consumer demand for authentic Egyptian farm foods (from Gharbia village farmers) before investing capital in inventory, production, or retail space.

---

## 🎯 Purpose of This Site

This website functions as a **demand validation tool** (feasibility study stage):
1. **Measures Interest:** Tracks how many people visit the site and browse products.
2. **Measures Purchase Intent:** Tracks how many people add items to an order.
3. **Measures Real Commitment:** Collects genuine pre-orders with contact information for delivery verification over WhatsApp.
4. **Demand Mapping:** Records interest from outside current delivery areas to plan geographic expansion.

---

## 🛠️ Tech Stack & Philosophy

- **Zero-Dependency Static Frontend:** Pure HTML5, CSS3, and vanilla JavaScript. No framework, no complex build tools.
- **Free Backend:** Google Apps Script connects submissions directly to a private Google Sheet.
- **Zero Cost Deployment:** Deployable 100% free on Cloudflare Pages, Netlify, or GitHub Pages.
- **Privacy & Security:** Strict Content Security Policy (CSP), client and server-side data sanitization (preventing spreadsheet formula injection), honeypot anti-spam, and privacy compliance.
- **Mobile-First & In-App Browser Resilient:** Optimized for mobile viewports (360px+), fast loading on 3G connections, large 44px+ tap targets.

---

## 📁 Project Structure

```
/
├─ index.html               # Main one-page storefront
├─ privacy.html             # Privacy policy (Arabic / English)
├─ config.js                # Owner settings (WhatsApp, links, IDs, areas)
├─ products.json            # Product catalog & pricing
├─ i18n/
│  ├─ ar.json               # Arabic texts & copy (default)
│  └─ en.json               # English translations
├─ css/
│  └─ styles.css            # Complete design system & responsive layout
├─ js/
│  ├─ main.js               # Entry point & UI listeners
│  ├─ i18n.js               # Dual-language manager
│  ├─ catalog.js            # Product grid & detail modal
│  ├─ cart.js               # Session-based cart
│  ├─ form.js               # Validation, order submission, waitlist
│  └─ track.js              # GA4 & First-party event analytics
├─ images/                  # SVGs & placeholders
├─ apps-script/
│  └─ Code.gs               # Backend handler for Google Apps Script
├─ docs/
│  └─ analytics-guide.md    # Funnel reporting guide & formulas
├─ _headers                 # Security headers for Cloudflare / Netlify
├─ robots.txt               # Search engine directives
├─ sitemap.xml              # XML Sitemap
├─ README.md                # Project documentation (this file)
└─ DEPLOY.md                # Step-by-step free deployment guide
```

---

## ✏️ How to Edit Content & Settings

You do **not** need to touch HTML, CSS, or JS files to update your site!

### 1. General Settings (`config.js`)
Edit this file to update:
- `brandName`: Your brand name.
- `whatsappNumber`: Your WhatsApp number for order confirmation (international format: `201XXXXXXXXX`).
- `appsScriptUrl`: The URL received after deploying Google Apps Script (see `DEPLOY.md`).
- `ga4MeasurementId`: Your Google Analytics 4 ID (optional).
- `metaPixelId`: Your Meta/Facebook Pixel ID (optional).
- `deliveryAreas` & `deliveryDays`: Available locations and fulfillment days.
- `farmers`: Array of farmer cards with names, villages, and quotes.

### 2. Products & Prices (`products.json`)
Edit this file to:
- Change product names, descriptions, and units.
- Set prices (set `price_egp: null` if you want to confirm price on order).
- Change availability (`available`, `coming_soon`, `sold_out`).
- Set minimum quantities and step increments (e.g., `0.5` kg).

---

## 🚀 How to Run Locally

You can run the site locally using any basic HTTP server:

### Using Python:
```bash
python -m http.server 8080
```
Open `http://localhost:8080` in your browser.

### Using Node.js:
```bash
npx serve
```

---

## 📌 Assumptions & Decisions

1. **Placeholder Brand & Images:** Neutral sample placeholder SVGs and `[BRAND_NAME]` are used until you have real assets.
2. **Order Flow Resilience:** If the Google Sheet submission fails due to poor connectivity or missing script setup, the site immediately falls back to opening WhatsApp with the complete prefilled order so you never lose a customer.
3. **Outside Delivery Area Orders:** We accept orders from areas outside your initial delivery zone and flag them as `in_delivery_area = FALSE`. This provides critical geographic demand data for your feasibility study.
4. **Google Fonts:** The Arabic font **Cairo** is loaded from Google Fonts for high-quality Arabic typography across devices.

