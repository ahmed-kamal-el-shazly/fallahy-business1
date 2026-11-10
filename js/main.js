// ============================================================
// main.js — App initialization and global event handlers
// ============================================================

// Utility: escape HTML for safe rendering via textContent alternative
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Modal helpers
function openModal(modal) {
  if (!modal) return;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Focus trap: focus first focusable element
  setTimeout(() => {
    const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) focusable.focus();
  }, 100);
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// ============================================================
// Initialization
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  const config = window.SITE_CONFIG;

  // ---- i18n ----
  await I18n.init();

  // ---- Brand name ----
  const logoEl = document.getElementById('headerLogo');
  if (logoEl) logoEl.textContent = config.brandName;

  const footerBrand = document.getElementById('footerBrand');
  if (footerBrand) footerBrand.textContent = config.brandName;

  const footerYear = document.getElementById('footerYear');
  if (footerYear) footerYear.textContent = new Date().getFullYear();

  // ---- WhatsApp links ----
  const waUrl = `https://wa.me/${config.whatsappNumber}`;
  const floatingWa = document.getElementById('floatingWa');
  if (floatingWa) {
    floatingWa.href = waUrl;
    floatingWa.addEventListener('click', () => {
      Track.event('click_whatsapp_general');
    });
  }
  const footerWa = document.getElementById('footerWhatsapp');
  if (footerWa) footerWa.href = waUrl;

  // ---- Social links ----
  setupSocialLink('footerFacebook', config.facebookUrl);
  setupSocialLink('footerInstagram', config.instagramUrl);
  setupSocialLink('footerTiktok', config.tiktokUrl);

  // ---- License ----
  if (config.licenseNumber) {
    const licEl = document.getElementById('footerLicense');
    if (licEl) {
      licEl.style.display = '';
      licEl.textContent = config.licenseNumber;
    }
  }

  // ---- Trust chips ----
  renderTrustChips();

  // ---- How it works ----
  renderSteps();

  // ---- Products ----
  await Catalog.loadProducts();
  Catalog.render();

  // ---- Cart ----
  Cart.load();
  Cart.updateUI();

  // ---- Farmers ----
  renderFarmers();

  // ---- FAQ ----
  renderFAQ();

  // ---- Tracking ----
  Track.init();

  // ---- Event Listeners ----
  setupEventListeners();
});

// ============================================================
// Render functions
// ============================================================

function renderTrustChips() {
  const container = document.getElementById('trustChips');
  if (!container) return;
  const chips = I18n.t('trustChips');
  if (!Array.isArray(chips)) return;
  container.innerHTML = '';
  chips.forEach(text => {
    const chip = document.createElement('span');
    chip.className = 'hero__chip';
    chip.textContent = text;
    container.appendChild(chip);
  });
}

function renderSteps() {
  const container = document.getElementById('stepsContainer');
  if (!container) return;
  const data = I18n.t('howItWorks');
  if (!data || !data.steps) return;
  container.innerHTML = '';
  data.steps.forEach((step, i) => {
    const el = document.createElement('div');
    el.className = 'step';
    el.innerHTML = `
      <div class="step__icon">${step.icon}</div>
      <span class="step__num">${i + 1}</span>
      <h3 class="step__title">${escapeHtml(step.title)}</h3>
      <p class="step__text">${escapeHtml(step.text)}</p>
    `;
    container.appendChild(el);
  });
}

function renderFarmers() {
  const farmers = window.SITE_CONFIG.farmers;
  const section = document.getElementById('farmers');
  const grid = document.getElementById('farmersGrid');
  if (!section || !grid) return;

  if (!farmers || farmers.length === 0) {
    section.style.display = 'none';
    // Also hide nav links to farmers
    document.querySelectorAll('.header__link--farmers, .mobile-nav__link--farmers').forEach(el => {
      el.style.display = 'none';
    });
    return;
  }

  section.style.display = '';
  grid.innerHTML = '';
  const lang = I18n.lang;

  farmers.forEach(farmer => {
    const card = document.createElement('div');
    card.className = 'farmer-card';
    card.innerHTML = `
      <img class="farmer-card__img" src="${escapeAttr(farmer.image || 'images/placeholder-farmer.webp')}" alt="${escapeAttr(farmer.name[lang])}" width="80" height="80" loading="lazy">
      <h3 class="farmer-card__name">${escapeHtml(farmer.name[lang])}</h3>
      <p class="farmer-card__village">${escapeHtml(farmer.village[lang])}</p>
      <p class="farmer-card__line">${escapeHtml(farmer.line[lang])}</p>
    `;
    grid.appendChild(card);
  });
}

function renderFAQ() {
  const list = document.getElementById('faqList');
  if (!list) return;
  const items = I18n.t('faq.items');
  if (!Array.isArray(items)) return;
  list.innerHTML = '';

  items.forEach(item => {
    const faqItem = document.createElement('div');
    faqItem.className = 'faq-item';

    const btn = document.createElement('button');
    btn.className = 'faq-item__q';
    btn.textContent = item.q;
    btn.setAttribute('aria-expanded', 'false');

    const answer = document.createElement('div');
    answer.className = 'faq-item__a';
    answer.textContent = item.a;

    btn.addEventListener('click', () => {
      const isOpen = faqItem.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', isOpen);
    });

    faqItem.appendChild(btn);
    faqItem.appendChild(answer);
    list.appendChild(faqItem);
  });
}

// ============================================================
// Event listeners
// ============================================================

function setupEventListeners() {
  // Language toggle
  const langBtn = document.getElementById('langToggle');
  if (langBtn) {
    langBtn.addEventListener('click', async () => {
      await I18n.toggle();
      Track.event('language_toggle', { lang: I18n.lang });
      // Re-render dynamic content
      renderTrustChips();
      renderSteps();
      Catalog.render();
      renderFarmers();
      renderFAQ();
      Cart.updateUI();
      // Update brand name
      const logoEl = document.getElementById('headerLogo');
      if (logoEl) logoEl.textContent = window.SITE_CONFIG.brandName;
    });
  }

  // Burger menu
  const burger = document.getElementById('menuBurger');
  const mobileNav = document.getElementById('mobileNav');
  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', isOpen);
      mobileNav.setAttribute('aria-hidden', !isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close mobile nav on link click
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        mobileNav.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    });
  }

  // Product actions delegation (add to cart, qty steppers, waitlist)
  document.addEventListener('click', (e) => {
    const target = e.target;

    // Add to order
    if (target.matches('[data-action="add"]')) {
      e.stopPropagation();
      const productId = target.dataset.productId;
      const container = target.closest('.product-card__actions, .product-detail__actions');
      const input = container ? container.querySelector('.qty-stepper__val') : null;
      const product = Catalog.getById(productId);
      if (!product) return;
      const qty = input ? parseFloat(input.value) || product.min_qty : product.min_qty;
      Cart.add(productId, qty);
    }

    // Increment
    if (target.matches('[data-action="increment"]')) {
      e.stopPropagation();
      const productId = target.dataset.productId;
      const product = Catalog.getById(productId);
      if (!product) return;
      const container = target.closest('.qty-stepper');
      const input = container.querySelector('.qty-stepper__val');
      let val = parseFloat(input.value) || product.min_qty;
      val = Math.round((val + product.step) * 1000) / 1000;
      input.value = val;
    }

    // Decrement
    if (target.matches('[data-action="decrement"]')) {
      e.stopPropagation();
      const productId = target.dataset.productId;
      const product = Catalog.getById(productId);
      if (!product) return;
      const container = target.closest('.qty-stepper');
      const input = container.querySelector('.qty-stepper__val');
      let val = parseFloat(input.value) || product.min_qty;
      val = Math.round((val - product.step) * 1000) / 1000;
      if (val < product.min_qty) val = product.min_qty;
      input.value = val;
    }

    // Waitlist button
    if (target.matches('[data-action="waitlist"]')) {
      e.stopPropagation();
      const productId = target.dataset.productId;
      openWaitlistModal(productId);
    }
  });

  // Cart continue button
  const cartContinueBtn = document.getElementById('cartContinueBtn');
  if (cartContinueBtn) {
    cartContinueBtn.addEventListener('click', () => {
      Form.openOrderModal();
    });
  }

  // Order form submit
  const orderForm = document.getElementById('orderForm');
  if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      Form.submit();
    });
  }

  // New order button
  const newOrderBtn = document.getElementById('newOrderBtn');
  if (newOrderBtn) {
    newOrderBtn.addEventListener('click', () => {
      closeModal(document.getElementById('orderModal'));
      // Reset form
      const form = document.getElementById('orderForm');
      if (form) {
        form.reset();
        form.style.display = '';
        form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
      }
      document.getElementById('orderSuccess').style.display = 'none';
      const submitBtn = document.getElementById('formSubmitBtn');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = I18n.t('form.submit');
      }
    });
  }

  // Modal close buttons & backdrops
  setupModalClose('productModal', 'productModalClose', 'productModalBackdrop');
  setupModalClose('orderModal', 'orderModalClose', 'orderModalBackdrop');
  setupModalClose('waitlistModal', 'waitlistModalClose', 'waitlistModalBackdrop');

  // Waitlist form
  const waitlistForm = document.getElementById('waitlistForm');
  if (waitlistForm) {
    waitlistForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const productId = document.getElementById('waitlistProductId').value;
      Form.submitWaitlist(productId);
    });
  }

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.is-open').forEach(modal => closeModal(modal));
    }
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

function setupModalClose(modalId, closeId, backdropId) {
  const modal = document.getElementById(modalId);
  const closeBtn = document.getElementById(closeId);
  const backdrop = document.getElementById(backdropId);

  if (closeBtn) closeBtn.addEventListener('click', () => closeModal(modal));
  if (backdrop) backdrop.addEventListener('click', () => closeModal(modal));
}

function openWaitlistModal(productId) {
  const modal = document.getElementById('waitlistModal');
  const form = document.getElementById('waitlistForm');
  const success = document.getElementById('waitlistSuccess');

  document.getElementById('waitlistProductId').value = productId;
  if (form) {
    form.style.display = '';
    form.reset();
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
  }
  if (success) success.style.display = 'none';

  openModal(modal);
}

function setupSocialLink(elementId, url) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (url) {
    el.href = url;
    el.style.display = '';
  } else {
    el.style.display = 'none';
  }
}

