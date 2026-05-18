'use strict';

// ============================================================
// booking.js — property.html
// Loads property data, drives the full-bleed gallery,
// date picker, price calculation and booking form submission.
// ============================================================

document.querySelectorAll('#footer-year').forEach(el => (el.textContent = new Date().getFullYear()));

// ── Sticky header shrink ──
const header = document.getElementById('site-header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

// ── URL params ──
const params     = new URLSearchParams(window.location.search);
const propertyId = params.get('id');

// ── State ──
let currentProperty    = null;
let currentPricing     = null;
let pricingDebounceTimer = null;
let blockedDates       = [];
let galleryImages      = [];
let galleryIndex       = 0;

// ── DOM refs ──
const loadingOverlay   = document.getElementById('loading-overlay');
const propertyContent  = document.getElementById('property-content');
const form             = document.getElementById('booking-form');
const payBtn           = document.getElementById('pay-btn');
const formError        = document.getElementById('form-error');
const priceBreakdown   = document.getElementById('price-breakdown');
const breakdownContent = document.getElementById('breakdown-content');
const breakdownLoading = document.getElementById('breakdown-loading');

// ── Helpers ──
function formatNGN(n) {
  return '₦' + Number(n).toLocaleString('en-NG');
}
function showError(msg) {
  formError.textContent = msg;
  formError.style.display = 'block';
  formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function clearError() {
  formError.style.display = 'none';
  formError.textContent = '';
}

// ============================================================
// Gallery
// ============================================================
function initGallery(images) {
  galleryImages = images;
  const mainImg   = document.getElementById('gallery-main-img');
  const dotsEl    = document.getElementById('gallery-dots');
  const counterEl = document.getElementById('gallery-counter');
  const prevBtn   = document.getElementById('gallery-prev');
  const nextBtn   = document.getElementById('gallery-next');

  if (!mainImg) return;

  function goTo(index) {
    galleryIndex = (index + images.length) % images.length;
    mainImg.style.opacity = '0.5';
    setTimeout(() => {
      mainImg.src = images[galleryIndex];
      mainImg.style.opacity = '1';
    }, 120);
    if (counterEl) counterEl.textContent = `${galleryIndex + 1} / ${images.length}`;
    if (dotsEl) {
      dotsEl.querySelectorAll('.gallery-thumb-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === galleryIndex);
      });
    }
  }

  // Set initial image
  mainImg.src = images[0];
  mainImg.alt = currentProperty?.name || 'Property photo';
  if (counterEl) counterEl.textContent = `1 / ${images.length}`;

  // Build dots
  if (dotsEl && images.length > 1) {
    images.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = `gallery-thumb-dot${i === 0 ? ' active' : ''}`;
      dot.setAttribute('aria-label', `Photo ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsEl.appendChild(dot);
    });
  }

  // Arrows (only show if multiple images)
  if (images.length <= 1) {
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
  } else {
    if (prevBtn) prevBtn.addEventListener('click', () => goTo(galleryIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goTo(galleryIndex + 1));
  }

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  goTo(galleryIndex - 1);
    if (e.key === 'ArrowRight') goTo(galleryIndex + 1);
  });

  // Hide counter if only one image
  if (images.length <= 1 && counterEl) counterEl.style.display = 'none';
}

// ============================================================
// Property render
// ============================================================
function renderProperty(p) {
  document.title = `${p.name} — Le NIDO by Bondd`;

  // Meta
  document.getElementById('prop-type').textContent     = p.type;
  document.getElementById('prop-location').textContent = p.location;
  document.getElementById('prop-name').textContent     = p.name;
  document.getElementById('prop-tagline').textContent  = p.tagline;
  document.getElementById('prop-description').textContent = p.description;

  // Specs bar
  const bedroomsEl = document.getElementById('spec-bedrooms');
  if (bedroomsEl) bedroomsEl.textContent = p.bedrooms === 0 ? 'Studio' : p.bedrooms;
  const bathroomsEl = document.getElementById('spec-bathrooms');
  if (bathroomsEl) bathroomsEl.textContent = p.bathrooms;
  const guestsEl = document.getElementById('spec-guests');
  if (guestsEl) guestsEl.textContent = `Up to ${p.maxGuests}`;
  const locationEl = document.getElementById('spec-location');
  if (locationEl) locationEl.textContent = p.location || '—';

  // Pricing
  document.getElementById('prop-price-night').textContent = formatNGN(p.pricing.night);
  const widgetPrice = document.getElementById('widget-price-night');
  if (widgetPrice) widgetPrice.textContent = formatNGN(p.pricing.night);
  document.getElementById('prop-price-other').innerHTML =
    `${formatNGN(p.pricing.week)} / week &nbsp;·&nbsp; ${formatNGN(p.pricing.month)} / month`;

  // Amenities
  const amenitiesList = document.getElementById('prop-amenities');
  if (amenitiesList && p.amenities?.length) {
    p.amenities.forEach(a => {
      const li = document.createElement('li');
      li.textContent = a;
      amenitiesList.appendChild(li);
    });
  }

  // WhatsApp links — pre-fill with property name, number from Railway env via /api/config
  const waMsg    = encodeURIComponent(`Hi, I'd like to enquire about ${p.name}`);
  const waNumber = window.__LENIDO_CONFIG__?.whatsappNumber || '2348000000000';
  const waUrl    = `https://wa.me/${waNumber}?text=${waMsg}`;
  document.querySelectorAll('#prop-whatsapp-btn, #header-whatsapp').forEach(el => {
    el.href = waUrl;
  });

  // Gallery
  const images = p.images?.filter(Boolean) || [];
  const fallbacks = [
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80',
    'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=1200&q=80',
  ];
  initGallery(images.length ? images : fallbacks);
}

// ============================================================
// Date pickers
// ============================================================
async function initDatePickers() {
  try {
    const res  = await fetch(`/api/calendar/${propertyId}/blocked-dates`);
    const json = await res.json();
    if (json.success) blockedDates = json.data;
  } catch {
    console.warn('[booking.js] Could not load blocked dates');
  }

  const checkInPicker = flatpickr('#check-in', {
    minDate: 'today',
    disable: blockedDates,
    disableMobile: false,
    dateFormat: 'Y-m-d',
    onChange(selectedDates) {
      if (selectedDates[0]) {
        const minNights = window.__PROPERTY_MIN_NIGHTS__ || 2;
        const minOut = new Date(selectedDates[0]);
        minOut.setDate(minOut.getDate() + minNights);
        checkOutPicker.set('minDate', minOut);
        checkOutPicker.clear();
        resetPriceBreakdown();
      }
    },
  });

  const checkOutPicker = flatpickr('#check-out', {
    minDate: new Date(Date.now() + 86400000),
    disable: blockedDates,
    disableMobile: false,
    dateFormat: 'Y-m-d',
    onChange(selectedDates) {
      if (selectedDates[0]) debouncedFetchPricing();
    },
  });
}

// ============================================================
// Pricing
// ============================================================
function resetPriceBreakdown() {
  currentPricing = null;
  priceBreakdown.style.display = 'none';
  breakdownContent.innerHTML   = '';
  payBtn.disabled    = true;
  payBtn.textContent = 'Select dates to continue';
}

function renderBreakdown(pricing) {
  const rows = [];
  rows.push(`<div class="breakdown-row">
    <span>${pricing.nights} night${pricing.nights > 1 ? 's' : ''} × ${formatNGN(pricing.baseRate)}</span>
    <span>${formatNGN(pricing.subtotal)}</span>
  </div>`);

  pricing.upliftSummary?.forEach(u => {
    rows.push(`<div class="breakdown-row uplift"><span>${u}</span><span></span></div>`);
  });

  pricing.discounts?.forEach(d => {
    rows.push(`<div class="breakdown-row highlight">
      <span>${d.reason} (${d.rate})</span>
      <span>−${formatNGN(d.saving)}</span>
    </div>`);
  });

  rows.push(`<div class="breakdown-total">
    <span>Total</span>
    <span>${formatNGN(pricing.total)}</span>
  </div>`);

  breakdownContent.innerHTML = rows.join('');
  priceBreakdown.style.display   = 'block';
  breakdownLoading.style.display = 'none';
  breakdownContent.style.display = 'block';
}

function calcLocalPricing(property, checkIn, checkOut) {
  const msPerDay = 86400000;
  const nights   = Math.round((new Date(checkOut) - new Date(checkIn)) / msPerDay);
  if (nights <= 0) return null;
  const baseRate = property.pricing.night;
  let   total    = nights * baseRate;
  const discounts = [];
  if (nights >= 7) {
    const weeklyTotal = Math.floor(nights / 7) * property.pricing.week + (nights % 7) * baseRate;
    const saving = total - weeklyTotal;
    if (saving > 0) { discounts.push({ reason: 'Weekly rate', rate: '7+ nights', saving }); total = weeklyTotal; }
  }
  return { nights, baseRate, subtotal: nights * baseRate, discounts, upliftSummary: [], total };
}

async function fetchPricing() {
  const checkIn  = document.getElementById('check-in').value;
  const checkOut = document.getElementById('check-out').value;
  if (!checkIn || !checkOut) return;

  breakdownLoading.style.display = 'flex';
  breakdownContent.style.display = 'none';
  priceBreakdown.style.display   = 'block';
  payBtn.disabled    = true;
  payBtn.textContent = 'Calculating…';

  let pricing = null;

  // Try live API
  if (!currentProperty?._offlineMode) {
    try {
      const res  = await fetch(`/api/bookings/pricing/${propertyId}?checkIn=${checkIn}&checkOut=${checkOut}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) pricing = json.data;
      }
    } catch { /* fall through */ }
  }

  // Fallback — calculate locally
  if (!pricing && currentProperty) {
    pricing = calcLocalPricing(currentProperty, checkIn, checkOut);
  }

  if (!pricing) {
    showError('Could not calculate price. Please try again.');
    resetPriceBreakdown();
    return;
  }

  currentPricing = pricing;
  renderBreakdown(pricing);
  payBtn.disabled    = false;
  payBtn.textContent = `Proceed to Checkout — ${formatNGN(pricing.total)}`;
  clearError();
}

function debouncedFetchPricing() {
  clearTimeout(pricingDebounceTimer);
  pricingDebounceTimer = setTimeout(fetchPricing, 350);
}

// ============================================================
// Form submission — navigate to dedicated booking page
// ============================================================
form.addEventListener('submit', e => {
  e.preventDefault();
  clearError();

  const checkIn  = document.getElementById('check-in').value;
  const checkOut = document.getElementById('check-out').value;

  if (!checkIn || !checkOut) return showError('Please select check-in and check-out dates.');
  if (!currentPricing)       return showError('Please wait for the price to load.');

  // Hand off to the dedicated booking page with dates pre-filled
  const url = `/booking.html?id=${encodeURIComponent(propertyId)}&checkIn=${checkIn}&checkOut=${checkOut}`;
  window.location.href = url;
});

// ============================================================
// Bootstrap
// ============================================================
async function loadFromContent(id) {
  try {
    const res  = await fetch('/content.json');
    if (!res.ok) return null;
    const data = await res.json();
    const props = data.properties || [];
    return id ? (props.find(p => p.id === id) || props[0]) : props[0];
  } catch {
    return null;
  }
}

async function init() {
  if (!propertyId) {
    loadingOverlay.innerHTML = '<p style="color:#dc2626;text-align:center">No property specified. <a href="/" style="color:inherit;text-decoration:underline">View all properties →</a></p>';
    return;
  }

  let property = null;

  // 1️⃣ Try live API
  try {
    const res  = await fetch(`/api/bookings/properties/${propertyId}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success) property = json.data;
    }
  } catch { /* fall through */ }

  // 2️⃣ Fallback — load from content.json
  if (!property) {
    property = await loadFromContent(propertyId);
    if (property) property._offlineMode = true;
  }

  if (!property) {
    loadingOverlay.innerHTML = '<p style="color:#dc2626;text-align:center">Could not load property. <a href="/" style="color:inherit;text-decoration:underline">View all properties →</a></p>';
    return;
  }

  currentProperty = property;
  window.__PROPERTY_MIN_NIGHTS__ = property.minimumNights || 2;
  renderProperty(property);
  await initDatePickers();

  loadingOverlay.style.display  = 'none';
  propertyContent.style.display = 'block';
}

init();
