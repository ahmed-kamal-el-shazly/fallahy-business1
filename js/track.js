// ============================================================
// track.js — Analytics and first-party event tracking
// ============================================================

const Track = (() => {
  let sessionId = '';
  let eventCount = 0;
  const MAX_EVENTS = 50;
  let utmData = {};

  /** Initialize tracking */
  function init() {
    sessionId = generateSessionId();
    captureUTM();
    loadGA4();
    loadMetaPixel();
    event('page_view', {});
  }

  /** Generate random session ID */
  function generateSessionId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 12; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  }

  /** Capture UTM params from URL into sessionStorage */
  function captureUTM() {
    const params = new URLSearchParams(window.location.search);
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
    keys.forEach(k => {
      const val = params.get(k);
      if (val) {
        try {
          sessionStorage.setItem(`fallahy_${k}`, val);
        } catch (e) { /* ignore */ }
      }
    });

    // Load from storage
    keys.forEach(k => {
      try {
        utmData[k] = sessionStorage.getItem(`fallahy_${k}`) || '';
      } catch (e) {
        utmData[k] = '';
      }
    });
  }

  /** Load GA4 only if measurement ID is set */
  function loadGA4() {
    const id = window.SITE_CONFIG.ga4MeasurementId;
    if (!id) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id, { send_page_view: false });
  }

  /** Load Meta Pixel only if ID is set */
  function loadMetaPixel() {
    const id = window.SITE_CONFIG.metaPixelId;
    if (!id) return;

    /* Meta Pixel base code */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', id);
    window.fbq('track', 'PageView');
  }

  /** Get device type */
  function getDeviceType() {
    const ua = navigator.userAgent || '';
    if (/Mobi|Android/i.test(ua)) return 'mobile';
    if (/Tablet|iPad/i.test(ua)) return 'tablet';
    return 'desktop';
  }

  /** Send event to GA4, Meta Pixel, and first-party sheet */
  function event(name, params) {
    params = params || {};

    // GA4
    if (window.gtag) {
      window.gtag('event', name, params);
    }

    // Meta Pixel
    if (window.fbq) {
      window.fbq('trackCustom', name, params);
    }

    // First-party event log to Apps Script
    sendFirstParty(name, params);
  }

  /** Send event to the Apps Script Events sheet */
  function sendFirstParty(name, params) {
    if (eventCount >= MAX_EVENTS) return;
    eventCount++;

    const url = window.SITE_CONFIG.appsScriptUrl;
    if (!url) return;

    const payload = JSON.stringify({
      type: 'event',
      session_id: sessionId,
      event: name,
      product_id: params.product_id || '',
      lang: I18n.lang,
      device: getDeviceType(),
      ...utmData,
      timestamp: new Date().toISOString()
    });

    // Use sendBeacon for reliability, fallback to fetch with keepalive
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, payload);
      } else {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: payload,
          keepalive: true
        }).catch(() => {});
      }
    } catch (e) { /* never block UI on tracking */ }
  }

  return { init, event };
})();

