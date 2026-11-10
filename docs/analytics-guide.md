# Analytics & Funnel Guide

This guide explains how to track and analyze visitor behavior across your website using Google Sheets formulas and UTM tags, with no paid tools.

---

## 1. The Measurement Funnel

Your site tracks the following key events:

| Stage | Meaning | Event Name |
|---|---|---|
| **1. Visit** | Arrived from a link/ad | `page_view` |
| **2. Interest** | Viewed product details | `view_product` |
| **3. Intent** | Added items to order | `add_to_order` |
| **4. Checkout** | Opened order form | `begin_order` |
| **5. Commitment** | Submitted the form | `submit_order` |
| **6. Confirmation**| Tapped "Confirm on WhatsApp" | `click_whatsapp_confirm` |

---

## 2. Setting Up the Funnel Tab in Google Sheets

Create a new tab named **`Funnel`** in your Google Sheet (alongside `Orders` and `Events`).

### Summary Table

Paste this table structure into columns A to D:

| A (Stage) | B (Event Name) | C (Count) | D (Conversion Rate) |
|---|---|---|---|
| **1. Visits** | `page_view` | `=COUNTIF(Events!C:C, B2)` | `100%` |
| **2. Product Views** | `view_product` | `=COUNTIF(Events!C:C, B3)` | `=C3/C$2` |
| **3. Added to Order** | `add_to_order` | `=COUNTIF(Events!C:C, B4)` | `=C4/C$2` |
| **4. Began Order** | `begin_order` | `=COUNTIF(Events!C:C, B5)` | `=C5/C$2` |
| **5. Submitted Order**| `submit_order` | `=COUNTIF(Events!C:C, B6)` | `=C6/C$2` |
| **6. Confirmed on WA** | `click_whatsapp_confirm`| `=COUNTIF(Events!C:C, B7)` | `=C7/C$2` |

> Format Column D as **Percentage** (`0.0%`).

---

## 3. Breakdown by Traffic Source (UTM)

To see which campaign or post brings the most serious buyers, add this table to your `Funnel` tab:

| Source | Visits (`page_view`) | Orders (`submit_order`) | Conversion Rate |
|---|---|---|---|
| `facebook` | `=COUNTIFS(Events!C:C, "page_view", Events!E:E, A11)` | `=COUNTIFS(Events!C:C, "submit_order", Events!E:E, A11)` | `=C11/B11` |
| `instagram`| `=COUNTIFS(Events!C:C, "page_view", Events!E:E, A12)` | `=COUNTIFS(Events!C:C, "submit_order", Events!E:E, A12)` | `=C12/B12` |
| `tiktok`   | `=COUNTIFS(Events!C:C, "page_view", Events!E:E, A13)` | `=COUNTIFS(Events!C:C, "submit_order", Events!E:E, A13)` | `=C13/B13` |
| `direct`   | `=COUNTIFS(Events!C:C, "page_view", Events!E:E, "")`  | `=COUNTIFS(Events!C:C, "submit_order", Events!E:E, "")`  | `=C14/B14` |

---

## 4. How to Create UTM Tracking Links

Always add UTM tags to links you share on social media, in ads, or in messages:

```
https://YOUR-SITE.pages.dev/?utm_source=SOURCE&utm_medium=MEDIUM&utm_campaign=CAMPAIGN&utm_content=CONTENT
```

### Examples:

- **Facebook Reel:**
  `https://YOUR-SITE.pages.dev/?utm_source=facebook&utm_medium=reel&utm_campaign=launch1&utm_content=rahaly_video`

- **Instagram Bio:**
  `https://YOUR-SITE.pages.dev/?utm_source=instagram&utm_medium=bio&utm_campaign=always_on`

- **WhatsApp Message to Friends:**
  `https://YOUR-SITE.pages.dev/?utm_source=whatsapp&utm_medium=chat&utm_campaign=friends_family`

- **TikTok Video:**
  `https://YOUR-SITE.pages.dev/?utm_source=tiktok&utm_medium=video&utm_campaign=launch1&utm_content=feteer_intro`

---

## 5. First-Party Tracking vs Google Analytics

Your site tracks events in **two independent ways**:

1. **First-party sheet (`Events` tab):**
   - Cannot be blocked by ad-blockers or in-app browser restrictions.
   - Always gives you accurate raw counts.
   - Preserves privacy: no personal names, phone numbers, or addresses are ever stored in `Events`.

2. **Google Analytics 4 (GA4):**
   - Gives you demographic insights, session durations, and user flow visualization.
   - Only active if `ga4MeasurementId` is set in `config.js`.
   - Never receives personal information.

