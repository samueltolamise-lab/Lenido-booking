'use strict';

// ============================================================
// payment.js — Paystack inline popup handler
// Expects PAYSTACK_PUBLIC_KEY to be injected by the server
// via a <script> tag or the /api/config endpoint.
// ============================================================

async function getPublicKey() {
  try {
    const res = await fetch('/api/config/public-key');
    const json = await res.json();
    return json.data.paystackPublicKey;
  } catch {
    console.error('[payment.js] Could not fetch Paystack public key');
    return null;
  }
}

window.openPaystackPopup = async function ({ email, amount, reference, accessCode, guestName }) {
  const publicKey = await getPublicKey();

  if (!publicKey) {
    const errorEl = document.getElementById('form-error');
    if (errorEl) {
      errorEl.textContent = 'Payment configuration error. Please contact the host.';
      errorEl.style.display = 'block';
    }
    const btn = document.getElementById('pay-btn');
    if (btn) btn.disabled = false;
    return;
  }

  const handler = PaystackPop.setup({
    key: publicKey,
    email,
    amount,          // already in kobo
    ref: reference,
    currency: 'NGN',
    firstname: guestName.split(' ')[0],
    lastname: guestName.split(' ').slice(1).join(' '),
    label: 'Le Nido by Bondd',
    metadata: { reference },

    callback(response) {
      // Payment popup completed — verify server-side and redirect
      window.location.href = `/confirmation.html?ref=${response.reference}`;
    },

    onClose() {
      // User closed the popup without paying
      const btn = document.getElementById('pay-btn');
      if (btn) {
        btn.disabled = false;
        btn.textContent = btn.textContent.replace('Initializing payment…', 'Pay Now — Try Again');
      }
    },
  });

  handler.openIframe();
};
