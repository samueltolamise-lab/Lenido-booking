'use strict';

// ============================================================
// config.js — fetches server config and applies it site-wide
// Loaded on every page. Updates WhatsApp links dynamically
// so HOST_WHATSAPP_NUMBER in Railway controls all buttons.
// ============================================================

// Expose a promise so other scripts can await the config being ready
window.__LENIDO_CONFIG_READY__ = (async function () {
  try {
    // Load runtime config (WhatsApp number, Paystack key) and site settings in parallel
    const [configRes, settingsRes] = await Promise.all([
      fetch('/api/config'),
      fetch('/api/content/settings'),
    ]);

    const configJson   = await configRes.json();
    const settingsJson = await settingsRes.json();

    // ── Runtime config ──
    if (configJson.success) {
      window.__LENIDO_CONFIG__ = configJson.data;

      const { whatsappNumber } = configJson.data;
      if (whatsappNumber) {
        // Replace every wa.me link on the page with the real number
        document.querySelectorAll('a[href*="wa.me/"]').forEach(link => {
          const url  = new URL(link.href);
          const text = url.searchParams.get('text');
          const base = `https://wa.me/${whatsappNumber}`;
          link.href  = text ? `${base}?text=${encodeURIComponent(text)}` : base;
        });
      }
    }

    // ── Site settings — apply on every page ──
    if (settingsJson.success && settingsJson.data) {
      const s = settingsJson.data;

      if (s.footerTagline) {
        document.querySelectorAll('#footer-tagline').forEach(el => { el.textContent = s.footerTagline; });
      }
      if (s.footerAddress) {
        document.querySelectorAll('#footer-address').forEach(el => { el.textContent = s.footerAddress; });
      }
    }

  } catch {
    // Server not reachable — content stays as hardcoded defaults
  }
})();
