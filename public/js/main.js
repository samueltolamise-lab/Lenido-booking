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
    id: 'forge',
    name: 'Le Nido — Forge',
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
      '/assets/properties/Forge/Studio_2.jpg',
      '/assets/properties/Forge/Studio_5.jpg',
      '/assets/properties/Forge/Studio_6.jpg',
      '/assets/properties/Forge/Studio_9.jpg',
      '/assets/properties/Forge/Studio_10.jpg',
      '/assets/properties/Forge/Studio_11.jpg',
      '/assets/properties/Forge/Studio_12.jpg',
      '/assets/properties/Forge/Studio_13.jpg',
      '/assets/properties/Forge/Studio_14.jpg',
      '/assets/properties/Forge/Studio_15.jpg',
      '/assets/properties/Forge/Studio_16.jpg',
      '/assets/properties/Forge/Studio_17.jpg',
      '/assets/properties/Forge/Studio_18.jpg',
      '/assets/properties/Forge/Studio_19.jpg',
      '/assets/properties/Forge/Studio_20.jpg',
    ],
  },
  {
    id: 'cedar',
    name: 'Le Nido — Cedar',
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
      '/assets/properties/Cedar/Image_1.jpg',
      '/assets/properties/Cedar/Image_2.jpg',
      '/assets/properties/Cedar/Image_3.jpg',
      '/assets/properties/Cedar/Image_4.jpg',
      '/assets/properties/Cedar/Image_5.jpg',
      '/assets/properties/Cedar/Image_6.jpg',
      '/assets/properties/Cedar/Image_7.jpg',
      '/assets/properties/Cedar/Image_8.jpg',
      '/assets/properties/Cedar/Image_9.jpg',
      '/assets/properties/Cedar/Image_10.jpg',
      '/assets/properties/Cedar/Image_11.jpg',
      '/assets/properties/Cedar/Image_12.jpg',
      '/assets/properties/Cedar/Image_13.jpg',
      '/assets/properties/Cedar/Image_14.jpg',
      '/assets/properties/Cedar/Image_15.jpg',
      '/assets/properties/Cedar/Image_16.jpg',
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

// ──────────────────────────────────────────────
// Site settings from Sanity
// ──────────────────────────────────────────────
async function loadSiteContent() {
  try {
    const [settingsRes, reviewsRes] = await Promise.all([
      fetch('/api/content/settings'),
      fetch('/api/content/reviews'),
    ]);

    const settingsJson = await settingsRes.json();
    const reviewsJson  = await reviewsRes.json();

    if (settingsJson.success && settingsJson.data) {
      applySettings(settingsJson.data);
    }

    if (reviewsJson.success && reviewsJson.data?.length) {
      renderReviews(reviewsJson.data);
    }
  } catch {
    // Silently fall back to hardcoded defaults
  }
}

function applySettings(s) {
  // Hero
  if (s.tagline) {
    // Split on comma or period to get two lines
    const parts = s.tagline.split(/,\s*/);
    const heading = document.getElementById('hero-heading');
    const warm    = document.getElementById('hero-title-warm');
    if (heading && parts[0]) heading.textContent = parts[0].trim() + (parts.length > 1 ? '' : '');
    if (warm    && parts[1]) warm.textContent    = parts[1].trim();
  }

  if (s.heroSubtitle) {
    const el = document.getElementById('hero-subtitle');
    if (el) el.textContent = s.heroSubtitle;
  }

  if (s.heroImage) {
    const img = document.querySelector('.hero-bg-img');
    if (img) img.src = s.heroImage;
  }

  // Footer tagline
  if (s.tagline || s.heroSubtitle) {
    const footer = document.getElementById('footer-tagline');
    if (footer && s.footerTagline) footer.textContent = s.footerTagline;
  }

  // Trust bar
  if (s.trustBar?.length) {
    const bar = document.getElementById('trust-bar-inner');
    if (bar) {
      bar.innerHTML = s.trustBar.map((stat, i) => `
        ${i > 0 ? '<div class="trust-divider" aria-hidden="true"></div>' : ''}
        <div class="trust-stat">
          <strong>${stat.value}</strong>
          <span>${stat.label}</span>
        </div>
      `).join('');
    }
  }

  // Perks
  if (s.perks?.length) {
    const grid = document.getElementById('perks-grid');
    if (grid) {
      grid.innerHTML = s.perks.map(perk => `
        <div class="perk-card">
          <div class="perk-icon" aria-hidden="true">${perk.icon || '✦'}</div>
          <h3>${perk.title}</h3>
          <p>${perk.description}</p>
        </div>
      `).join('');
    }
  }
}

function renderReviews(reviews) {
  const grid = document.getElementById('testimonials-grid');
  if (!grid) return;

  const stars = (n) => '★'.repeat(n || 5);

  grid.innerHTML = reviews.map(r => `
    <article class="testimonial-card">
      <div class="testimonial-stars" aria-label="${r.rating} stars">${stars(r.rating)}</div>
      <blockquote class="testimonial-quote">"${r.review}"</blockquote>
      <footer class="testimonial-author">
        <div class="author-avatar" aria-hidden="true">${r.guestName?.[0] || '?'}</div>
        <div>
          <strong>${r.guestName}</strong>
          <span>${[r.guestOrigin, r.stayMonth].filter(Boolean).join(' · ')}</span>
        </div>
      </footer>
    </article>
  `).join('');
}

loadSiteContent();
