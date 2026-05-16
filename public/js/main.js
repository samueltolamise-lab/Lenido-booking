'use strict';

// ============================================================
// main.js — index.html: property listing page
// ============================================================

document.querySelectorAll('#footer-year').forEach(el => (el.textContent = new Date().getFullYear()));

// ──────────────────────────────────────────────
// Sticky header shrink on scroll
// ──────────────────────────────────────────────
const header = document.getElementById('site-header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

// ──────────────────────────────────────────────
// Utility
// ──────────────────────────────────────────────
function formatNGN(amount) {
  return '₦' + Number(amount).toLocaleString('en-NG');
}

function bedroomLabel(bedrooms) {
  if (bedrooms === 0) return 'Studio';
  return bedrooms === 1 ? '1 Bedroom' : `${bedrooms} Bedrooms`;
}

// ──────────────────────────────────────────────
// Property card builder
// ──────────────────────────────────────────────
function createPropertyCard(property) {
  const card = document.createElement('article');
  card.className = 'property-card';

  const nightPrice   = formatNGN(property.pricing.night);
  const weekPrice    = formatNGN(property.pricing.week);
  const monthPrice   = formatNGN(property.pricing.month);
  const bedLabel     = bedroomLabel(property.bedrooms);
  const guestLabel   = `${property.maxGuests} guest${property.maxGuests > 1 ? 's' : ''}`;
  const bathLabel    = `${property.bathrooms} bath${property.bathrooms > 1 ? 's' : ''}`;

  // Pick up to 3 amenities for the preview strip
  const featuredAmenities = (property.amenities || []).slice(0, 3);

  card.innerHTML = `
    <a href="/property.html?id=${property.id}" class="property-card-img-link" tabindex="-1" aria-hidden="true">
      <div class="property-card-img">
        <img
          src="${property.images[0]}"
          alt="${property.name}"
          loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&q=70'"
        />
        <span class="card-badge">${property.type}</span>
        <div class="card-img-overlay"></div>
      </div>
    </a>

    <div class="property-card-body">
      <p class="card-location">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        ${property.location}
      </p>

      <h2 class="card-name">${property.name}</h2>
      <p class="card-tagline">${property.tagline}</p>

      <div class="card-specs">
        <span class="spec">${bedLabel}</span>
        <span class="spec-dot" aria-hidden="true">·</span>
        <span class="spec">${bathLabel}</span>
        <span class="spec-dot" aria-hidden="true">·</span>
        <span class="spec">${guestLabel}</span>
      </div>

      ${featuredAmenities.length ? `
      <ul class="card-amenities" aria-label="Featured amenities">
        ${featuredAmenities.map(a => `<li>${a}</li>`).join('')}
        ${property.amenities.length > 3 ? `<li class="more-amenities">+${property.amenities.length - 3} more</li>` : ''}
      </ul>` : ''}

      <div class="card-footer">
        <div class="card-pricing">
          <span class="card-price-amount">${nightPrice}</span>
          <span class="card-price-unit">/ night</span>
        </div>
        <div class="card-price-alts">
          <span title="Weekly rate">${weekPrice}<em>/wk</em></span>
          <span title="Monthly rate">${monthPrice}<em>/mo</em></span>
        </div>
      </div>

      <a href="/property.html?id=${property.id}" class="btn btn-primary btn-full card-cta">
        View &amp; Book
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </a>
    </div>
  `;
  return card;
}

// ──────────────────────────────────────────────
// Mock data (used when server isn't running)
// ──────────────────────────────────────────────
const MOCK_PROPERTIES = [
  {
    id: 'lekki-01',
    name: 'Le Nido Lekki 01',
    type: 'Studio',
    location: 'Lekki Phase 1, Lagos',
    tagline: 'Your private retreat in the heart of Lekki',
    description: 'A beautifully designed studio apartment in Lekki Phase 1. Fully air-conditioned, high-speed WiFi, Netflix-ready smart TV, and a fully equipped kitchenette.',
    maxGuests: 2,
    bedrooms: 0,
    bathrooms: 1,
    amenities: ['High-Speed WiFi', 'Air Conditioning', 'Smart TV / Netflix', 'Fully Equipped Kitchenette', '24/7 Security', 'Dedicated Parking', 'Backup Generator', 'Workspace Desk'],
    pricing: { night: 85000, week: 530000, month: 1800000 },
    images: [
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=1200&q=80',
    ],
  },
  {
    id: 'lekki-02',
    name: 'Le Nido Lekki 02',
    type: '1 Bedroom',
    location: 'Lekki Phase 1, Lagos',
    tagline: 'Spacious comfort with a Lagos state of mind',
    description: 'A premium 1-bedroom apartment with a separate living area. Ideal for business travelers, small families, or anyone who wants extra space and privacy.',
    maxGuests: 3,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ['High-Speed WiFi', 'Air Conditioning (All Rooms)', 'Smart TV / Netflix', 'Fully Equipped Kitchen', 'Dining Area', '24/7 Security', 'Dedicated Parking', 'Washing Machine'],
    pricing: { night: 120000, week: 750000, month: 2500000 },
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80',
    ],
  },
];

// ──────────────────────────────────────────────
// Load & render properties
// ──────────────────────────────────────────────
async function loadProperties() {
  const grid = document.getElementById('properties-grid');
  if (!grid) return;

  try {
    const res = await fetch('/api/bookings/properties');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();

    if (!json.success || !json.data.length) {
      renderProperties(grid, MOCK_PROPERTIES);
      return;
    }

    renderProperties(grid, json.data);
  } catch {
    // Server not running — use mock data so the page still looks great
    renderProperties(grid, MOCK_PROPERTIES);
  }
}

function renderProperties(grid, properties) {
  grid.innerHTML = '';
  if (!properties.length) {
    grid.innerHTML = '<p class="no-properties">No properties available right now. Check back soon.</p>';
    return;
  }
  properties.forEach(p => {
    const card = createPropertyCard(p);
    card.style.animationDelay = `${Array.from(grid.children).length * 0.08}s`;
    grid.appendChild(card);
  });
}

loadProperties();
