// ============================================================
// form.js — Order form handling, validation, submission
// ============================================================

const Form = (() => {
  let lastSubmitTime = 0;
  const THROTTLE_MS = 30000;

  // Arabic-Indic digit mapping
  const arabicIndicMap = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
  };

  /** Convert Arabic-Indic digits to Western digits */
  function normalizeDigits(str) {
    return str.replace(/[٠-٩]/g, d => arabicIndicMap[d] || d);
  }

  /** Validate Egyptian mobile: 01[0125]XXXXXXXX (11 digits) */
  function isValidEgPhone(phone) {
    const normalized = normalizeDigits(phone.trim().replace(/[\s\-()]/g, ''));
    return /^01[0125]\d{8}$/.test(normalized);
  }

  /** Normalize phone to digits only */
  function normalizePhone(phone) {
    return normalizeDigits(phone.trim().replace(/[\s\-()]/g, ''));
  }

  /** Generate order ID: ORD-YYMMDD-XXXX */
  function generateOrderId() {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += chars[Math.floor(Math.random() * chars.length)];
    }
    return `ORD-${yy}${mm}${dd}-${rand}`;
  }

  /** Get UTM params from sessionStorage */
  function getUTM() {
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
    const utm = {};
    keys.forEach(k => {
      try {
        utm[k] = sessionStorage.getItem(`fallahy_${k}`) || '';
      } catch (e) {
        utm[k] = '';
      }
    });
    return utm;
  }

  /** Get device type */
  function getDeviceType() {
    const ua = navigator.userAgent || '';
    if (/Mobi|Android/i.test(ua)) return 'mobile';
    if (/Tablet|iPad/i.test(ua)) return 'tablet';
    return 'desktop';
  }

  /** Validate form fields, returns { valid, data, errors } */
  function validate() {
    const errors = {};
    const form = document.getElementById('orderForm');

    const name = form.fullname.value.trim();
    const phone = form.phone.value.trim();
    const governorate = form.governorate.value;
    const area = form.area.value.trim();
    const address = form.address.value.trim();
    const deliveryDay = form.delivery_day.value;
    const notes = form.notes.value.trim();
    const consent = form.consent.checked;
    const honeypot = form.website.value;

    if (name.length < 2 || name.length > 60) errors.name = true;
    if (!isValidEgPhone(phone)) errors.phone = true;
    if (!governorate) errors.governorate = true;
    if (!area) errors.area = true;
    if (address.length < 5 || address.length > 200) errors.address = true;
    if (!deliveryDay) errors.day = true;
    if (!consent) errors.consent = true;

    // Apply visual errors
    setFieldError('formName', 'formNameError', errors.name);
    setFieldError('formPhone', 'formPhoneError', errors.phone);
    setFieldError('formGovernorate', 'formGovernorateError', errors.governorate);
    setFieldError('formArea', 'formAreaError', errors.area);
    setFieldError('formAddress', 'formAddressError', errors.address);
    setFieldError('formDay', 'formDayError', errors.day);
    setFieldError('formConsent', 'formConsentError', errors.consent);

    const valid = Object.keys(errors).length === 0;
    const utm = getUTM();

    const inDeliveryArea = window.SITE_CONFIG.deliveryAreas.includes(governorate);

    const data = {
      name,
      phone: normalizePhone(phone),
      governorate,
      area,
      address,
      delivery_day: deliveryDay,
      notes: notes.slice(0, 300),
      consent: true,
      honeypot,
      in_delivery_area: inDeliveryArea,
      lang: I18n.lang,
      device: getDeviceType(),
      referrer: document.referrer || '',
      timestamp: new Date().toISOString(),
      ...utm
    };

    // Show outside-area notice
    const outsideMsg = document.getElementById('outsideAreaMsg');
    if (outsideMsg) {
      outsideMsg.style.display = (valid && !inDeliveryArea && governorate) ? '' : 'none';
    }

    return { valid, data, errors };
  }

  function setFieldError(fieldId, errorId, hasError) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    if (hasError) {
      field.classList.add('is-invalid');
    } else {
      field.classList.remove('is-invalid');
    }
  }

  /** Submit order to Apps Script */
  async function submit() {
    const { valid, data, errors } = validate();
    if (!valid) {
      // Scroll to first error
      const firstError = document.querySelector('.is-invalid');
      if (firstError) firstError.focus();
      return;
    }

    // Honeypot check
    if (data.honeypot) {
      showSuccess(generateOrderId(), data);
      return;
    }

    // Throttle
    const now = Date.now();
    if (now - lastSubmitTime < THROTTLE_MS) return;
    lastSubmitTime = now;

    const submitBtn = document.getElementById('formSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = I18n.t('form.sending');

    const orderId = generateOrderId();
    const cartItems = Cart.buildItemsJSON();
    const total = Cart.getTotal();

    const payload = {
      type: 'order',
      order_id: orderId,
      ...data,
      items_json: JSON.stringify(cartItems),
      items_summary: Cart.buildSummaryText(),
      est_total: total
    };

    const url = window.SITE_CONFIG.appsScriptUrl;
    let submitted = false;

    if (url) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeout);
        submitted = true;
      } catch (err) {
        console.warn('[form] Submission failed, using WhatsApp fallback:', err);
        submitted = false;
      }
    }

    Track.event('submit_order', {
      order_id: orderId,
      item_count: cartItems.length,
      est_total: total
    });

    showSuccess(orderId, data, submitted);
  }

  /** Show success screen with WhatsApp confirmation */
  function showSuccess(orderId, formData, serverSaved) {
    const form = document.getElementById('orderForm');
    const success = document.getElementById('orderSuccess');
    const cartReview = document.getElementById('orderCartReview');
    if (form) form.style.display = 'none';
    if (cartReview) cartReview.style.display = 'none';
    if (success) success.style.display = '';

    document.getElementById('successOrderId').textContent = orderId;

    // Build summary
    const summaryEl = document.getElementById('successSummary');
    summaryEl.textContent = Cart.buildSummaryText();

    const total = Cart.getTotal();

    // Build WhatsApp message
    const lang = I18n.lang;
    const items = Cart.buildSummaryText();
    let msg = '';
    if (lang === 'ar') {
      msg = `طلب جديد 🛒\nرقم الطلب: ${orderId}\n\nالاسم: ${formData.name}\nالموبايل: ${formData.phone}\nالمحافظة: ${formData.governorate}\nالمنطقة: ${formData.area}\nالعنوان: ${formData.address}\nيوم التوصيل: ${formData.delivery_day}\n\nالطلب:\n${items}`;
      if (total != null) msg += `\n\nالإجمالي التقديري: ${total} ${window.SITE_CONFIG.currency}`;
      if (formData.notes) msg += `\n\nملاحظات: ${formData.notes}`;
    } else {
      msg = `New Order 🛒\nOrder ID: ${orderId}\n\nName: ${formData.name}\nMobile: ${formData.phone}\nGovernorate: ${formData.governorate}\nArea: ${formData.area}\nAddress: ${formData.address}\nDelivery Day: ${formData.delivery_day}\n\nOrder:\n${items}`;
      if (total != null) msg += `\n\nEstimated Total: ${total} ${window.SITE_CONFIG.currency}`;
      if (formData.notes) msg += `\n\nNotes: ${formData.notes}`;
    }

    const waUrl = `https://wa.me/${window.SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    const waBtn = document.getElementById('whatsappConfirmBtn');
    if (waBtn) {
      waBtn.href = waUrl;
      waBtn.addEventListener('click', () => {
        Track.event('click_whatsapp_confirm', { order_id: orderId });
      }, { once: true });
    }

    // Clear cart
    Cart.clear();
  }

  /** Open the order modal with cart review */
  function openOrderModal() {
    const items = Cart.getItems();
    if (items.length === 0) return;

    Track.event('begin_order', { item_count: items.length });

    const modal = document.getElementById('orderModal');
    const form = document.getElementById('orderForm');
    const success = document.getElementById('orderSuccess');

    // Reset form display
    if (form) form.style.display = '';
    if (success) success.style.display = 'none';

    // Render cart review
    renderCartReview();

    // Populate governorates
    populateGovernorates();

    // Populate delivery days
    populateDeliveryDays();

    openModal(modal);
  }

  /** Render cart review inside the order modal */
  function renderCartReview() {
    const container = document.getElementById('orderCartReview');
    if (!container) return;
    container.style.display = '';
    container.innerHTML = '';

    const lang = I18n.lang;
    const items = Cart.getItems();

    const review = document.createElement('div');
    review.className = 'cart-review';

    items.forEach(({ product, qty }) => {
      const row = document.createElement('div');
      row.className = 'cart-review__item';

      const nameEl = document.createElement('span');
      nameEl.className = 'cart-review__name';
      nameEl.textContent = product.name[lang];

      const qtyEl = document.createElement('span');
      qtyEl.className = 'cart-review__qty';
      qtyEl.textContent = `${qty} ${product.unit[lang]}`;

      const priceEl = document.createElement('span');
      priceEl.className = 'cart-review__price';
      priceEl.textContent = product.price_egp != null
        ? `${(product.price_egp * qty).toFixed(2)} ${window.SITE_CONFIG.currency}`
        : I18n.t('cart.pricePending');

      const removeBtn = document.createElement('button');
      removeBtn.className = 'cart-review__remove';
      removeBtn.textContent = I18n.t('cart.remove');
      removeBtn.addEventListener('click', () => {
        Cart.remove(product.id);
        renderCartReview();
        if (Cart.getCount() === 0) {
          closeModal(document.getElementById('orderModal'));
        }
      });

      row.appendChild(nameEl);
      row.appendChild(qtyEl);
      row.appendChild(priceEl);
      row.appendChild(removeBtn);
      review.appendChild(row);
    });

    // Total row
    const total = Cart.getTotal();
    if (total != null) {
      const totalRow = document.createElement('div');
      totalRow.className = 'cart-review__total';
      const totalLabel = document.createElement('span');
      totalLabel.textContent = I18n.t('cart.estimatedTotal');
      const totalVal = document.createElement('span');
      totalVal.textContent = `${total} ${window.SITE_CONFIG.currency}`;
      totalRow.appendChild(totalLabel);
      totalRow.appendChild(totalVal);
      review.appendChild(totalRow);
    }

    container.appendChild(review);
  }

  /** Populate governorate dropdown */
  function populateGovernorates() {
    const select = document.getElementById('formGovernorate');
    if (!select || select.options.length > 1) return;

    const lang = I18n.lang;
    const govs = [...window.SITE_CONFIG.deliveryAreas, 'Other'];
    govs.forEach(gov => {
      const opt = document.createElement('option');
      opt.value = gov;
      opt.textContent = I18n.t(`form.governorates.${gov}`) || gov;
      select.appendChild(opt);
    });
  }

  /** Populate delivery day dropdown */
  function populateDeliveryDays() {
    const select = document.getElementById('formDay');
    if (!select || select.options.length > 1) return;

    const days = [...window.SITE_CONFIG.deliveryDays, 'Any'];
    days.forEach(day => {
      const opt = document.createElement('option');
      opt.value = day;
      opt.textContent = I18n.t(`form.deliveryDays.${day}`) || day;
      select.appendChild(opt);
    });
  }

  /** Submit waitlist entry */
  async function submitWaitlist(productId) {
    const nameEl = document.getElementById('waitlistName');
    const phoneEl = document.getElementById('waitlistPhone');
    const name = nameEl.value.trim();
    const phone = phoneEl.value.trim();

    let hasError = false;
    if (!name) {
      nameEl.classList.add('is-invalid');
      hasError = true;
    } else {
      nameEl.classList.remove('is-invalid');
    }

    if (!isValidEgPhone(phone)) {
      phoneEl.classList.add('is-invalid');
      hasError = true;
    } else {
      phoneEl.classList.remove('is-invalid');
    }

    if (hasError) return;

    const utm = getUTM();
    const payload = {
      type: 'waitlist',
      name,
      phone: normalizePhone(phone),
      product_id: productId,
      lang: I18n.lang,
      device: getDeviceType(),
      timestamp: new Date().toISOString(),
      ...utm
    };

    const url = window.SITE_CONFIG.appsScriptUrl;
    if (url) {
      try {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        console.warn('[form] Waitlist submission failed:', e);
      }
    }

    Track.event('join_waitlist', { product_id: productId });

    // Show success
    document.getElementById('waitlistForm').style.display = 'none';
    document.getElementById('waitlistSuccess').style.display = '';
  }

  return { submit, openOrderModal, submitWaitlist, validate, normalizeDigits, isValidEgPhone };
})();

