// ============================================================
// cart.js — Shopping cart (session-based, no account needed)
// ============================================================

const Cart = (() => {
  const STORAGE_KEY = 'fallahy_cart';
  let items = {}; // { productId: qty }

  /** Load cart from sessionStorage */
  function load() {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        items = JSON.parse(stored);
      }
    } catch (e) { /* storage unavailable */ }
  }

  /** Save cart to sessionStorage */
  function save() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) { /* storage unavailable */ }
  }

  /** Add item or update quantity */
  function add(productId, qty) {
    const product = Catalog.getById(productId);
    if (!product) return;
    if (product.availability !== 'available') return;

    qty = Math.max(product.min_qty, qty);
    items[productId] = qty;
    save();
    updateUI();
    Track.event('add_to_order', { product_id: productId, qty });
  }

  /** Remove item */
  function remove(productId) {
    delete items[productId];
    save();
    updateUI();
  }

  /** Update quantity */
  function updateQty(productId, qty) {
    const product = Catalog.getById(productId);
    if (!product) return;
    if (qty <= 0) {
      remove(productId);
      return;
    }
    qty = Math.max(product.min_qty, qty);
    items[productId] = qty;
    save();
    updateUI();
  }

  /** Get quantity for a product */
  function getQty(productId) {
    return items[productId] || 0;
  }

  /** Get all cart items as array of { product, qty } */
  function getItems() {
    return Object.entries(items)
      .map(([id, qty]) => ({ product: Catalog.getById(id), qty }))
      .filter(i => i.product);
  }

  /** Get total count of items */
  function getCount() {
    return Object.keys(items).length;
  }

  /** Calculate estimated total (null if any product has no price) */
  function getTotal() {
    const cartItems = getItems();
    if (cartItems.length === 0) return null;
    let total = 0;
    let allPriced = true;
    for (const { product, qty } of cartItems) {
      if (product.price_egp == null) {
        allPriced = false;
      } else {
        total += product.price_egp * qty;
      }
    }
    return allPriced ? Math.round(total * 100) / 100 : null;
  }

  /** Clear the cart */
  function clear() {
    items = {};
    save();
    updateUI();
  }

  /** Update the sticky cart bar UI */
  function updateUI() {
    const bar = document.getElementById('cartBar');
    const countEl = document.getElementById('cartCount');
    const totalEl = document.getElementById('cartTotal');
    const fab = document.getElementById('floatingWa');
    if (!bar) return;

    const count = getCount();
    if (count === 0) {
      bar.style.display = 'none';
      if (fab) fab.classList.add('fab-whatsapp--no-cart');
      return;
    }

    bar.style.display = '';
    if (fab) fab.classList.remove('fab-whatsapp--no-cart');

    const lang = I18n.lang;
    const itemWord = count === 1 ? I18n.t('cart.item') : I18n.t('cart.items');
    countEl.textContent = `${count} ${itemWord}`;

    const total = getTotal();
    if (total != null) {
      totalEl.textContent = `${I18n.t('cart.estimatedTotal')}: ${total} ${window.SITE_CONFIG.currency}`;
    } else {
      totalEl.textContent = I18n.t('cart.pricePending');
    }
  }

  /** Build items summary text for WhatsApp / sheet */
  function buildSummaryText() {
    const lang = I18n.lang;
    return getItems().map(({ product, qty }) => {
      const price = product.price_egp != null ? ` × ${product.price_egp} ${window.SITE_CONFIG.currency}` : '';
      return `${product.name[lang]} — ${qty} ${product.unit[lang]}${price}`;
    }).join('\n');
  }

  /** Build items JSON for sheet */
  function buildItemsJSON() {
    return getItems().map(({ product, qty }) => ({
      id: product.id,
      name_ar: product.name.ar,
      name_en: product.name.en,
      qty,
      unit_ar: product.unit.ar,
      unit_en: product.unit.en,
      price_egp: product.price_egp
    }));
  }

  return { load, add, remove, updateQty, getQty, getItems, getCount, getTotal, clear, updateUI, buildSummaryText, buildItemsJSON };
})();

