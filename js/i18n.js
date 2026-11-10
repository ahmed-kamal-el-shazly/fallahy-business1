// ============================================================
// i18n.js — Internationalisation module
// ============================================================

const I18n = (() => {
  let currentLang = 'ar';
  let strings = {};
  const cache = {};

  /** Load language JSON */
  async function loadLang(lang) {
    if (cache[lang]) {
      strings = cache[lang];
      currentLang = lang;
      return;
    }
    try {
      const res = await fetch(`i18n/${lang}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      cache[lang] = data;
      strings = data;
      currentLang = lang;
    } catch (err) {
      console.error(`[i18n] Failed to load ${lang}:`, err);
    }
  }

  /** Get a nested string by dot-path, e.g. "hero.headline" */
  function t(key) {
    const parts = key.split('.');
    let val = strings;
    for (const p of parts) {
      if (val == null) return key;
      val = val[p];
    }
    return val != null ? val : key;
  }

  /** Apply translations to all [data-i18n] elements */
  function applyAll() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = t(key);
      if (typeof text === 'string') {
        el.textContent = text;
      }
    });

    // Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const text = t(key);
      if (typeof text === 'string') {
        el.placeholder = text;
      }
    });

    // Update HTML lang and dir
    const html = document.documentElement;
    html.lang = currentLang;
    html.dir = currentLang === 'ar' ? 'rtl' : 'ltr';

    // Update page title and meta
    const title = t('siteTitle');
    if (title && title !== 'siteTitle') {
      document.title = title;
    }
    const metaDesc = document.querySelector('meta[name="description"]');
    const desc = t('siteDescription');
    if (metaDesc && desc && desc !== 'siteDescription') {
      metaDesc.setAttribute('content', desc);
    }
  }

  /** Save language preference */
  function saveLang(lang) {
    try {
      localStorage.setItem('fallahy_lang', lang);
    } catch (e) { /* storage unavailable */ }
  }

  /** Load saved preference */
  function getSavedLang() {
    try {
      return localStorage.getItem('fallahy_lang');
    } catch (e) {
      return null;
    }
  }

  /** Toggle between ar and en */
  async function toggle() {
    const newLang = currentLang === 'ar' ? 'en' : 'ar';
    await loadLang(newLang);
    applyAll();
    saveLang(newLang);
    // Dispatch event for other modules to react
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: newLang } }));
  }

  /** Initialize */
  async function init() {
    const saved = getSavedLang();
    const lang = saved === 'en' ? 'en' : 'ar';
    await loadLang(lang);
    applyAll();
  }

  return { init, t, toggle, applyAll, get lang() { return currentLang; } };
})();

