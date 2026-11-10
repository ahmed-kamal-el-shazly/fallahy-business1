# Deployment Guide (100% Free Hosting & Backend)

This step-by-step guide walks you through setting up your free backend (Google Sheets + Apps Script) and deploying the static website for free on **Cloudflare Pages** (with **Netlify** as an alternative). No credit card is required.

---

## Step 1: Set Up Google Sheets & Google Apps Script (Free Backend)

The website uses Google Apps Script to save incoming pre-orders, waitlist requests, and user tracking events into a private Google Sheet.

### 1.1 Create the Google Sheet
1. Go to [Google Sheets](https://sheets.new) while logged into your Google account.
2. Name your spreadsheet (e.g., `Fallahy Orders & Tracking`).
3. Rename the first tab from `Sheet1` to **`Orders`**.
4. Create a second tab named **`Events`**.
5. *(Optional)* Create a third tab named **`Funnel`** (see `docs/analytics-guide.md` for ready-to-use formulas).

### 1.2 Set Column Headers
To ensure proper column mapping, add these exact headers in row 1:

**Tab: `Orders`** (row 1, columns A through W):
```
timestamp | order_id | type | status | name | phone | governorate | area | address | delivery_day | notes | items_json | items_summary | est_total | in_delivery_area | lang | utm_source | utm_medium | utm_campaign | utm_content | referrer | device | consent
```

**Tab: `Events`** (row 1, columns A through J):
```
timestamp | session_id | event | product_id | utm_source | utm_medium | utm_campaign | utm_content | lang | device
```

> *Note:* Even if you leave the sheets empty without headers, the script will automatically create the sheets and write headers on the very first submission.

### 1.3 Add the Apps Script Code
1. In your Google Sheet, click **Extensions** → **Apps Script**.
2. Delete any boilerplate code inside the editor.
3. Open `apps-script/Code.gs` from your project folder, copy all contents, and paste them into the Apps Script editor.
4. *(Optional)* If you want email alerts on every order, find `EMAIL_ON_ORDER: false` in the script, change it to `true`, and fill in `OWNER_EMAIL: "your-email@gmail.com"`.
5. Click the **Save** icon (diskette).

### 1.4 Deploy as Web App
1. Click the blue **Deploy** button (top right) → **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Configure the settings:
   - **Description:** `Production API v1`
   - **Execute as:** `Me (your email)`
   - **Who has access:** `Anyone` *(Crucial: allows the static frontend to POST without Google sign-in)*
4. Click **Deploy**.
5. Grant access permissions when prompted:
   - Click *Review permissions* → choose your account.
   - If you see "Google hasn't verified this app", click *Advanced* → *Go to untitled project (unsafe)* → *Allow*.
6. Copy the **Web App URL** provided (it looks like `https://script.google.com/macros/s/.../exec`).

### 1.5 Update `config.js`
Open `config.js` in your project folder and paste the URL:
```javascript
window.SITE_CONFIG = {
  brandName: "اسم البراند",
  whatsappNumber: "201012345678", // Your real WhatsApp number with Egypt country code 20
  appsScriptUrl: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec",
  ...
};
```

---

## Step 2: (Optional) Google Analytics 4 Setup

If you want visual user-flow funnels and demographics in GA4:
1. Go to [analytics.google.com](https://analytics.google.com) and create a free property.
2. Create a **Web** data stream pointing to your domain or temporary URL.
3. Copy the **Measurement ID** (e.g., `G-XXXXXXXXXX`).
4. Paste it into `config.js`:
   ```javascript
   ga4MeasurementId: "G-XXXXXXXXXX",
   ```
*(If left empty, no Google scripts are loaded, keeping the site 100% private and lightweight).*

---

## Step 3: Deploy Frontend to Cloudflare Pages (Recommended - Free)

Cloudflare Pages provides global CDN, automatic SSL certificates, and zero downtime at zero cost.

### Option A: Via GitHub (Recommended for easy future updates)
1. Push this project folder to a GitHub repository.
2. Sign up or log into [Cloudflare Dashboard](https://dash.cloudflare.com/).
3. In the left menu, select **Compute (Workers & Pages)** → **Pages** → **Connect to Git**.
4. Select your GitHub repository.
5. In build settings:
   - **Framework preset:** `None`
   - **Build command:** *(leave empty)*
   - **Build output directory:** `.` or `/` (root directory)
6. Click **Save and Deploy**.
7. Cloudflare will give you a live URL like `https://fallahy-xxx.pages.dev`.

### Option B: Direct Drag-and-Drop (No Git required)
1. In Cloudflare Dashboard, go to **Workers & Pages** → **Create application** → **Pages** → **Upload assets**.
2. Name your project (e.g. `fallahy-food`).
3. Drag and drop your entire project folder (or a zip of it).
4. Click **Deploy site**.

---

## Step 4: Alternative Host — Netlify (Free)

1. Sign up or log in to [Netlify](https://www.netlify.com/).
2. Drag and drop your project directory into the Netlify **"Sites"** drop zone.
3. Your site is live immediately with a free `https://your-site.netlify.app` address and free automatic SSL.

---

## Step 5: Final Launch Verification Checklist

Before publishing links on social media:

- [ ] **Config check:** Is `config.js` updated with your real WhatsApp number and brand name?
- [ ] **Catalog review:** Check `products.json` for initial prices or verify that items with `null` display *"Price confirmed on order"*.
- [ ] **Mobile responsive check:** Open on a mobile device or inspect at 360px width.
- [ ] **Order test:** Place a test order on the live website:
  - Verify that the order row appears in your Google Sheet (`Orders` tab).
  - Tap the green WhatsApp button on the thank-you screen to verify the prefilled text.
- [ ] **Waitlist test:** Tap "Notify me" on a `coming_soon` item and submit your name/number. Check that a row with `type = waitlist` is recorded.
- [ ] **Tracking test:** Open the `Events` tab in your Google Sheet to verify that `page_view` and `view_product` events are being logged.
- [ ] **UTM test:** Visit `https://your-site/?utm_source=test&utm_campaign=launch1` and place an order. Confirm that `test` and `launch1` are captured in the row.

