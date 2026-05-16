'use strict';

// ============================================================
// config.js — fetches server config and applies it site-wide
// Loaded on every page. Updates WhatsApp links dynamically
// so HOST_WHATSAPP_NUMBER in Railway controls all buttons.
// ============================================================

(async function () {
  try {
    const res  = await fetch('/api/config');
    const json = await res.json();
    if (!json.success) return;

    const { whatsappNumber } = json.data;
    if (!whatsappNumber) return;

    // Replace every wa.me link on the page with the real number
    document.querySelectorAll('a[href*="wa.me/"]').forEach(link => {
      const url = new URL(link.href);
      // Preserve the ?text= query param if present
      const text = url.searchParams.get('text');
      const base = `https://wa.me/${whatsappNumber}`;
      link.href  = text ? `${base}?text=${encodeURIComponent(text)}` : base;
    });

    // Expose globally so booking.js / payment.js can use it
    window.__LENIDO_CONFIG__ = json.data;

  } catch {
    // Server not reachable — links stay as-is (fallback number in HTML)
  }
})();
