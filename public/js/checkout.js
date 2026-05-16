'use strict';

// ============================================================
// checkout.js — /booking.html
// Standalone checkout page: loads property, date pickers,
// live price calculation, guest counter, form validation,
// and Paystack payment.
// ============================================================

document.querySelectorAll('#footer-year').forEach(el => (el.textContent = new Date().getFullYear()));

// ── Sticky header ──
const header = document.getElementById('site-header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

// ── URL params ──
const params     = new URLSearchParams(window.location.search);
const propertyId = params.get('id');
const preCheckIn  = params.get('checkIn')  || params.get('check_in')  || '';
const preCheckOut = params.get('checkOut') || params.get('check_out') || '';

// ── State ──
let currentProperty   = null;
let currentPricing    = null;
let pricingTimer      = null;
let guestCount        = 1;
let maxGuests         = 2;
let checkInPicker     = null;
let checkOutPicker    = null;

// ── DOM refs ──
const pageLoading      = document.getElementById('page-loading');
const bookingContent   = document.getElementById('booking-content');
const form             = document.getElementById('checkout-form');
const payBtn           = document.getElementById('pay-btn');
const formError        = document.getElementById('form-error');
const breakdownCard    = document.getElementById('price-breakdown-card');
const breakdownLoading = document.getElementById('breakdown-loading');
const breakdownRows    = document.getElementById('breakdown-rows');
const nightsChip       = document.getElementById('nights-chip');
const nightsChipText   = document.getElementById('nights-chip-text');
const guestsCount      = document.getElementById('guests-count');
const guestsInput      = document.getElementById('guests-input');
const guestsPlus       = document.getElementById('guests-plus');
const guestsMinus      = document.getElementById('guests-minus');

// ── Helpers ──
function formatNGN(n) {
  return '₦' + Number(n).toLocaleString('en-NG');
}

function showError(msg) {
  formError.textContent = msg;
  formError.classList.add('visible');
  formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearError() {
  formError.textContent = '';
  formError.classList.remove('visible');
}

function nightsBetween(a, b) {
  const msPerDay = 86400000;
  return Math.round((new Date(b) - new Date(a)) / msPerDay);
}

// ============================================================
// Render property summary
// ============================================================
function renderSummary(p) {
  document.title = `Book ${p.name} — Le NIDO by Bondd`;

  // Image — prefer local, fall back to Unsplash
  const img = document.getElementById('prop-img');
  const imgSrc = (p.images && p.images[0]) ? p.images[0] : (p.imageFallbacks && p.imageFallbacks[0]);
  if (imgSrc) {
    img.src = imgSrc;
    img.alt = p.name;
    img.onerror = () => {
      if (p.imageFallbacks && p.imageFallbacks[0]) img.src = p.imageFallbacks[0];
    };
  }

  document.getElementById('prop-type-badge').textContent = p.type;
  document.getElementById('prop-name').textContent       = p.name;
  document.getElementById('prop-location').innerHTML     =
    `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${p.location}`;

  // Specs
  document.getElementById('spec-bedrooms').textContent  = p.bedrooms === 0 ? 'Studio' : `${p.bedrooms} bed`;
  document.getElementById('spec-bathrooms').textContent = `${p.bathrooms} bath`;
  document.getElementById('spec-guests').textContent    = p.maxGuests;

  // Pricing
  document.getElementById('prop-price-night').innerHTML = `${formatNGN(p.pricing.night)}<span> / night</span>`;
  document.getElementById('prop-price-alt').innerHTML   =
    `${formatNGN(p.pricing.week)} / week &nbsp;·&nbsp; ${formatNGN(p.pricing.month)} / month`;

  // Amenities (first 8)
  const grid = document.getElementById('amenity-grid');
  if (grid && p.amenities) {
    p.amenities.slice(0, 8).forEach(a => {
      const div = document.createElement('div');
      div.className = 'amenity-item';
      div.innerHTML = `<span class="amenity-dot" aria-hidden="true"></span>${a}`;
      grid.appendChild(div);
    });
  }

  // WhatsApp link
  const waMsg = encodeURIComponent(`Hi, I'd like help booking ${p.name}`);
  const waUrl = `https://wa.me/${p.whatsappNumber || '2348000000000'}?text=${waMsg}`;
  const waEl  = document.getElementById('header-whatsapp');
  if (waEl) waEl.href = waUrl;

  // Back link
  const backEl = document.getElementById('back-link');
  if (backEl) backEl.href = `/property.html?id=${p.id}`;

  // Guest counter max
  maxGuests = p.maxGuests || 2;
  updateGuestUI();
}

// ============================================================
// Guest counter
// ============================================================
function updateGuestUI() {
  guestsCount.textContent = guestCount;
  guestsInput.value       = guestCount;
  guestsMinus.disabled    = guestCount <= 1;
  guestsPlus.disabled     = guestCount >= maxGuests;
}

guestsPlus.addEventListener('click', () => {
  if (guestCount < maxGuests) { guestCount++; updateGuestUI(); }
});
guestsMinus.addEventListener('click', () => {
  if (guestCount > 1) { guestCount--; updateGuestUI(); }
});

// ============================================================
// Date pickers
// ============================================================
async function initDatePickers() {
  let blockedDates = [];
  try {
    const res  = await fetch(`/api/calendar/${propertyId}/blocked-dates`);
    const json = await res.json();
    if (json.success) blockedDates = json.data;
  } catch {
    console.warn('[checkout.js] Could not load blocked dates — continuing without them.');
  }

  checkInPicker = flatpickr('#check-in', {
    minDate:       'today',
    disable:       blockedDates,
    disableMobile: false,
    dateFormat:    'Y-m-d',
    defaultDate:   preCheckIn || null,
    onChange(selectedDates) {
      if (selectedDates[0]) {
        const minOut = new Date(selectedDates[0]);
        minOut.setDate(minOut.getDate() + 1);
        checkOutPicker.set('minDate', minOut);
        checkOutPicker.clear();
        resetBreakdown();
      }
    },
  });

  checkOutPicker = flatpickr('#check-out', {
    minDate:       new Date(Date.now() + 86400000),
    disable:       blockedDates,
    disableMobile: false,
    dateFormat:    'Y-m-d',
    defaultDate:   preCheckOut || null,
    onChange(selectedDates) {
      if (selectedDates[0]) triggerPricing();
    },
  });

  // If dates were pre-filled from URL, trigger pricing immediately
  if (preCheckIn && preCheckOut) triggerPricing();
}

// ============================================================
// Pricing
// ============================================================
function resetBreakdown() {
  currentPricing = null;
  breakdownCard.classList.remove('visible');
  breakdownRows.innerHTML   = '';
  breakdownRows.style.display = 'none';
  nightsChip.classList.remove('visible');
  payBtn.disabled    = true;
  payBtn.textContent = 'Select dates to continue';
  // Reset progress
  document.getElementById('step2').classList.remove('active');
}

function renderBreakdown(pricing) {
  const rows = [];

  rows.push(`<div class="breakdown-row">
    <span>${pricing.nights} night${pricing.nights > 1 ? 's' : ''} × ${formatNGN(pricing.baseRate)}</span>
    <span>${formatNGN(pricing.subtotal)}</span>
  </div>`);

  if (pricing.upliftSummary?.length) {
    pricing.upliftSummary.forEach(u => {
      rows.push(`<div class="breakdown-row uplift"><span>${u}</span><span></span></div>`);
    });
  }

  if (pricing.discounts?.length) {
    pricing.discounts.forEach(d => {
      rows.push(`<div class="breakdown-row discount">
        <span>${d.reason} (${d.rate})</span>
        <span>−${formatNGN(d.saving)}</span>
      </div>`);
    });
  }

  rows.push(`<div class="breakdown-divider"></div>`);
  rows.push(`<div class="breakdown-total-row">
    <span>Total due</span>
    <span>${formatNGN(pricing.total)}</span>
  </div>`);

  breakdownRows.innerHTML     = rows.join('');
  breakdownLoading.style.display = 'none';
  breakdownRows.style.display    = 'block';
  breakdownCard.classList.add('visible');

  // Update nights chip
  nightsChipText.textContent = `${pricing.nights} night${pricing.nights > 1 ? 's' : ''}`;
  nightsChip.classList.add('visible');

  // Unlock pay button
  payBtn.disabled = false;
  payBtn.innerHTML = `Pay <span class="btn-amount">${formatNGN(pricing.total)}</span> — Confirm Booking`;

  // Advance progress
  document.getElementById('step2').classList.add('active');
}

async function fetchPricing() {
  const checkIn  = document.getElementById('check-in').value;
  const checkOut = document.getElementById('check-out').value;
  if (!checkIn || !checkOut) return;

  // Optimistic nights chip
  const nights = nightsBetween(checkIn, checkOut);
  if (nights > 0) {
    nightsChipText.textContent = `${nights} night${nights > 1 ? 's' : ''}`;
    nightsChip.classList.add('visible');
  }

  breakdownLoading.style.display = 'flex';
  breakdownRows.style.display    = 'none';
  breakdownCard.classList.add('visible');
  payBtn.disabled    = true;
  payBtn.textContent = 'Calculating…';
  clearError();

  try {
    const pid = currentProperty?.id || propertyId;
    let pricing = null;

    // Try live API
    if (pid && !currentProperty?._offlineMode) {
      try {
        const res  = await fetch(`/api/bookings/pricing/${pid}?checkIn=${checkIn}&checkOut=${checkOut}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) pricing = json.data;
        }
      } catch { /* fall through */ }
    }

    // Fallback: calculate locally from content.json pricing
    if (!pricing && currentProperty) {
      pricing = calcLocalPricing(currentProperty, checkIn, checkOut);
    }

    if (!pricing) {
      showError('Could not calculate price. Please try different dates.');
      resetBreakdown();
      return;
    }

    currentPricing = pricing;
    renderBreakdown(pricing);
  } catch {
    showError('Could not calculate price. Please check your connection and try again.');
    resetBreakdown();
  }
}

function triggerPricing() {
  clearTimeout(pricingTimer);
  pricingTimer = setTimeout(fetchPricing, 400);
}

// ============================================================
// Form submission
// ============================================================
form.addEventListener('submit', async e => {
  e.preventDefault();
  clearError();

  const checkIn         = document.getElementById('check-in').value.trim();
  const checkOut        = document.getElementById('check-out').value.trim();
  const guestName       = document.getElementById('guest-name').value.trim();
  const guestEmail      = document.getElementById('guest-email').value.trim();
  const guestPhone      = document.getElementById('guest-phone').value.trim();
  const specialRequests = document.getElementById('special-requests').value.trim();

  // Validation
  if (!checkIn || !checkOut) return showError('Please select your check-in and check-out dates.');
  if (!guestName)            return showError('Please enter your full name.');
  if (!guestEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail))
                             return showError('Please enter a valid email address.');
  if (!guestPhone)           return showError('Please enter your WhatsApp number.');
  if (!currentPricing)       return showError('Please wait while we calculate the price.');

  payBtn.disabled    = true;
  payBtn.textContent = 'Initialising payment…';

  const resetPayBtn = () => {
    payBtn.disabled = false;
    payBtn.innerHTML = `Pay <span class="btn-amount">${formatNGN(currentPricing.total)}</span> — Confirm Booking`;
  };

  // If server is available, initialise booking server-side first
  if (!currentProperty?._offlineMode) {
    try {
      const res  = await fetch('/api/bookings/initialize', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: currentProperty?.id || propertyId,
          checkIn, checkOut, guests: guestCount,
          guestName, guestEmail, guestPhone, specialRequests,
        }),
      });
      const json = await res.json();

      if (json.success) {
        window.openPaystackPopup({
          email:      guestEmail,
          amount:     json.data.amount * 100,
          reference:  json.data.reference,
          accessCode: json.data.accessCode,
          guestName,
        });
        return;
      }
      // API returned an error — fall through to direct Paystack
    } catch { /* server unavailable — fall through */ }
  }

  // Offline / direct mode: open Paystack with locally-calculated amount
  const ref = 'LN-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
  window.openPaystackPopup({
    email:     guestEmail,
    amount:    currentPricing.total * 100,   // kobo
    reference: ref,
    guestName,
  });
});

// ============================================================
// Local pricing (used when server is unavailable)
// ============================================================
function calcLocalPricing(property, checkIn, checkOut) {
  const nights = nightsBetween(checkIn, checkOut);
  if (nights <= 0) return null;

  const baseRate  = property.pricing.night;
  let   subtotal  = nights * baseRate;
  const discounts = [];

  // Weekly discount
  if (nights >= 7) {
    const weeklyTotal = Math.floor(nights / 7) * property.pricing.week
                      + (nights % 7) * baseRate;
    const saving = subtotal - weeklyTotal;
    if (saving > 0) {
      discounts.push({ reason: 'Weekly rate', rate: '7+ nights', saving });
      subtotal = weeklyTotal;
    }
  }

  return {
    nights,
    baseRate,
    subtotal:       nights * baseRate,
    discounts,
    upliftSummary:  [],
    total:          subtotal,
  };
}

// ============================================================
// Bootstrap
// ============================================================
async function loadPropertyFromContent(id) {
  // content.json is served from /public/content.json by Express,
  // and also accessible directly when the file is opened locally.
  const candidates = ['/content.json', './content.json'];
  for (const path of candidates) {
    try {
      const res  = await fetch(path);
      if (!res.ok) continue;
      const data = await res.json();
      const props = data.properties || [];
      // If no id given, default to the first property
      return id ? (props.find(p => p.id === id) || props[0]) : props[0];
    } catch { /* try next */ }
  }
  return null;
}

async function init() {
  // Resolve the property ID — default to first property if none given
  const resolvedId = propertyId || null;

  let property = null;

  // 1️⃣ Try the live API first
  if (resolvedId) {
    try {
      const res = await fetch(`/api/bookings/properties/${resolvedId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) property = json.data;
      }
    } catch { /* fall through to content.json */ }
  }

  // 2️⃣ Fallback: load from content.json (works without the server)
  if (!property) {
    property = await loadPropertyFromContent(resolvedId);
    if (property) {
      // Signal that we're in offline mode — pricing will be calculated locally
      property._offlineMode = true;
    }
  }

  if (!property) {
    pageLoading.innerHTML = `
      <p style="color:var(--color-error);text-align:center;line-height:1.6">
        Could not load property details.<br>
        <a href="/" style="color:inherit;text-decoration:underline">View all properties →</a>
      </p>`;
    return;
  }

  currentProperty = property;
  renderSummary(property);
  await initDatePickers();

  pageLoading.style.display    = 'none';
  bookingContent.style.display = 'block';
}

init();
