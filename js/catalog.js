// ============================================================
// catalog.js — Product catalog rendering
// ============================================================

const Catalog = (() => {
  let products = [];

  /** Fetch products from products.json */
  async function loadProducts() {
    try {
      const res = await fetch('products.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      products = data.products || [];
    } catch (err) {
      console.error('[catalog] Failed to load products:', err);
      products = [];
    }
  }

  /** Get all products */
  function getAll() {
    return products;
  }

  /** Get product by id */
  function getById(id) {
    return products.find(p => p.id === id) || null;
  }

  /** Render product cards into the grid */
  function render() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const lang = I18n.lang;

    products.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.setAttribute('role', 'article');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', product.name[lang]);
      card.dataset.productId = product.id;

      const availText = I18n.t(`products.${product.availability}`);
      const priceDisplay = product.price_egp != null
        ? `${product.price_egp} ${window.SITE_CONFIG.currency} / ${product.unit[lang]}`
        : I18n.t('products.priceOnOrder');

      const isSoldOut = product.availability === 'sold_out';
      const isComingSoon = product.availability === 'coming_soon';

      card.innerHTML = `
        <div class="product-card__img-wrap">
          <img class="product-card__img" src="${escapeAttr(product.image)}" alt="${escapeAttr(product.name[lang])}" width="400" height="300" loading="lazy">
          <span class="product-card__sample-badge">${escapeHtml(I18n.t('products.samplePhoto'))}</span>
          <span class="product-card__badge product-card__badge--${product.availability}">${escapeHtml(availText)}</span>
        </div>
        <div class="product-card__body">
          <h3 class="product-card__name">${escapeHtml(product.name[lang])}</h3>
          <p class="product-card__desc">${escapeHtml(product.description[lang])}</p>
          <p class="product-card__price ${product.price_egp == null ? 'product-card__price--pending' : ''}">${escapeHtml(priceDisplay)}</p>
          <div class="product-card__actions" data-product-id="${escapeAttr(product.id)}">
            ${renderCardActions(product, lang, isSoldOut, isComingSoon)}
          </div>
        </div>
      `;

      // Click on card (not actions) opens detail modal
      card.addEventListener('click', (e) => {
        // Don't open modal if clicking on buttons inside actions
        if (e.target.closest('.product-card__actions')) return;
        openDetailModal(product);
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.target.closest('.product-card__actions')) {
          openDetailModal(product);
        }
      });

      grid.appendChild(card);
    });
  }

  function renderCardActions(product, lang, isSoldOut, isComingSoon) {
    if (isSoldOut) {
      return `<span class="btn btn--outline btn--sm" style="opacity:0.5;cursor:not-allowed;">${escapeHtml(I18n.t('products.soldOut'))}</span>`;
    }
    if (isComingSoon) {
      return `<button class="btn btn--outline btn--sm" data-action="waitlist" data-product-id="${escapeAttr(product.id)}">${escapeHtml(I18n.t('products.notifyMe'))}</button>`;
    }

    const cartQty = Cart.getQty(product.id);
    const qty = cartQty > 0 ? cartQty : product.min_qty;

    return `
      <div class="qty-stepper">
        <button class="qty-stepper__btn" data-action="decrement" data-product-id="${escapeAttr(product.id)}" aria-label="Decrease quantity">−</button>
        <input class="qty-stepper__val" type="number" value="${qty}" min="${product.min_qty}" step="${product.step}" data-product-id="${escapeAttr(product.id)}" aria-label="Quantity">
        <button class="qty-stepper__btn" data-action="increment" data-product-id="${escapeAttr(product.id)}" aria-label="Increase quantity">+</button>
      </div>
      <button class="btn btn--primary btn--sm" data-action="add" data-product-id="${escapeAttr(product.id)}">${escapeHtml(I18n.t('products.addToOrder'))}</button>
    `;
  }

  /** Open product detail modal */
  function openDetailModal(product) {
    const lang = I18n.lang;
    const modal = document.getElementById('productModal');
    if (!modal) return;

    // Fire tracking event
    Track.event('view_product', { product_id: product.id });

    const img = document.getElementById('productModalImg');
    img.src = product.image;
    img.alt = product.name[lang];

    document.getElementById('productModalTitle').textContent = product.name[lang];
    document.getElementById('productModalDesc').textContent = product.description[lang];

    // Meta
    const metaEl = document.getElementById('productModalMeta');
    metaEl.innerHTML = '';

    const priceDisplay = product.price_egp != null
      ? `${product.price_egp} ${window.SITE_CONFIG.currency} / ${product.unit[lang]}`
      : I18n.t('products.priceOnOrder');

    addMetaRow(metaEl, I18n.t('products.unit'), product.unit[lang]);
    addMetaRow(metaEl, I18n.t('products.title').replace(/s$/, ''), priceDisplay);

    if (product.origin && product.origin[lang]) {
      addMetaRow(metaEl, I18n.t('products.origin'), product.origin[lang]);
    }
    if (product.storage && product.storage[lang]) {
      addMetaRow(metaEl, I18n.t('products.storage'), product.storage[lang]);
    }
    if (product.min_qty) {
      addMetaRow(metaEl, I18n.t('products.minOrder'), `${product.min_qty} ${product.unit[lang]}`);
    }

    // Actions
    const actionsEl = document.getElementById('productModalActions');
    const isSoldOut = product.availability === 'sold_out';
    const isComingSoon = product.availability === 'coming_soon';
    actionsEl.innerHTML = renderCardActions(product, lang, isSoldOut, isComingSoon);

    openModal(modal);
  }

  function addMetaRow(container, label, value) {
    const row = document.createElement('div');
    row.className = 'product-detail__meta-row';
    const labelEl = document.createElement('span');
    labelEl.className = 'product-detail__meta-label';
    labelEl.textContent = label;
    const valEl = document.createElement('span');
    valEl.textContent = value;
    row.appendChild(labelEl);
    row.appendChild(valEl);
    container.appendChild(row);
  }

  return { loadProducts, render, getAll, getById, openDetailModal };
})();

