'use strict';

// ============================================================
// server/services/sanity.js
// Fetches content from Sanity CDN and caches it in memory.
// Falls back to static properties.js if Sanity isn't configured.
// ============================================================

const staticProperties = require('../config/properties');

let sanityClient = null;

function getClient() {
  if (sanityClient) return sanityClient;

  const projectId = process.env.SANITY_PROJECT_ID;
  const dataset   = process.env.SANITY_DATASET || 'production';

  if (!projectId || projectId === 'YOUR_PROJECT_ID') return null;

  try {
    const { createClient } = require('@sanity/client');
    sanityClient = createClient({
      projectId,
      dataset,
      useCdn: true,
      apiVersion: '2024-01-01',
    });
    return sanityClient;
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────
// In-memory cache (refreshed every 5 minutes)
// ──────────────────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000;

const cache = {
  properties:   { data: null, ts: 0 },
  reviews:      { data: null, ts: 0 },
  siteSettings: { data: null, ts: 0 },
};

function isFresh(key) {
  return cache[key].data !== null && Date.now() - cache[key].ts < CACHE_TTL_MS;
}

// ──────────────────────────────────────────────
// GROQ queries
// ──────────────────────────────────────────────
const PROPERTY_QUERY = `
  *[_type == "property" && active != false] | order(_createdAt asc) {
    "id":        slug.current,
    name,
    type,
    location,
    tagline,
    description,
    bedrooms,
    bathrooms,
    maxGuests,
    amenities,
    minimumNights,
    pricing,
    icalUrl,
    "images": images[].asset->url
  }
`;

const REVIEW_QUERY = `
  *[_type == "review" && visible == true] | order(order asc) {
    "id":         _id,
    "propertyId": property->slug.current,
    guestName,
    guestOrigin,
    stayMonth,
    rating,
    "review":     review
  }
`;

const SETTINGS_QUERY = `
  *[_type == "siteSettings"][0] {
    siteName,
    tagline,
    heroSubtitle,
    whatsappNumber,
    whatsappGreeting,
    email,
    trustBar,
    perks,
    propertiesSectionTitle,
    propertiesSectionSubtitle,
    whyChooseUsEyebrow,
    whyChooseUsHeading,
    footerTagline,
    footerAddress,
    "heroImage": heroImage.asset->url
  }
`;

// ──────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────

async function getProperties() {
  if (isFresh('properties')) return cache.properties.data;

  const client = getClient();
  if (!client) {
    // Sanity not configured — return static properties
    console.log('[Sanity] Not configured. Using static properties.');
    return Object.values(staticProperties);
  }

  try {
    const data = await client.fetch(PROPERTY_QUERY);
    cache.properties = { data, ts: Date.now() };
    console.log(`[Sanity] Fetched ${data.length} properties.`);
    return data;
  } catch (err) {
    console.error('[Sanity] Failed to fetch properties:', err.message);
    // Fallback to static on error
    return Object.values(staticProperties);
  }
}

async function getPropertyById(id) {
  const list = await getProperties();
  return list.find(p => p.id === id) || null;
}

async function getReviews() {
  if (isFresh('reviews')) return cache.reviews.data;

  const client = getClient();
  if (!client) return [];

  try {
    const data = await client.fetch(REVIEW_QUERY);
    cache.reviews = { data, ts: Date.now() };
    return data;
  } catch (err) {
    console.error('[Sanity] Failed to fetch reviews:', err.message);
    return [];
  }
}

async function getSiteSettings() {
  if (isFresh('siteSettings')) return cache.siteSettings.data;

  const client = getClient();
  if (!client) return null;

  try {
    const data = await client.fetch(SETTINGS_QUERY);
    cache.siteSettings = { data, ts: Date.now() };
    return data;
  } catch (err) {
    console.error('[Sanity] Failed to fetch site settings:', err.message);
    return null;
  }
}

/** Force-clear the cache (e.g. after a Sanity webhook) */
function invalidateCache() {
  Object.keys(cache).forEach(k => { cache[k] = { data: null, ts: 0 }; });
}

module.exports = { getProperties, getPropertyById, getReviews, getSiteSettings, invalidateCache };
