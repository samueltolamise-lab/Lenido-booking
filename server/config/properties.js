'use strict';

require('dotenv').config();

const properties = {
  'lekki-01': {
    id: 'lekki-01',
    name: 'Le Nido Lekki 01',
    type: 'Studio',
    location: 'Lekki Phase 1, Lagos',
    tagline: 'Your private retreat in the heart of Lekki',
    description:
      'A beautifully designed studio apartment in Lekki Phase 1. Fully air-conditioned, high-speed WiFi, Netflix-ready smart TV, and a fully equipped kitchenette. Perfect for solo travelers, business professionals, and couples looking for a quiet, stylish base in Lagos.',
    maxGuests: 2,
    bedrooms: 0,
    bathrooms: 1,
    amenities: [
      'High-Speed WiFi',
      'Air Conditioning',
      'Smart TV / Netflix',
      'Fully Equipped Kitchenette',
      '24/7 Security',
      'Dedicated Parking',
      'Backup Generator',
      'Water Dispenser',
      'Iron & Ironing Board',
      'Premium Toiletries',
      'Clean Linens & Towels',
      'Workspace Desk',
    ],
    pricing: {
      night: 85000,
      week: 530000,
      month: 1800000,
    },
    images: [
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=1200&q=80',
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80',
    ],
    icalUrl: process.env.ICAL_URL_LEKKI_01 || '',
  },

  'lekki-02': {
    id: 'lekki-02',
    name: 'Le Nido Lekki 02',
    type: '1 Bedroom',
    location: 'Lekki Phase 1, Lagos',
    tagline: 'Spacious comfort with a Lagos state of mind',
    description:
      'A premium 1-bedroom apartment with a separate living area in Lekki Phase 1. Ideal for business travelers, small families, or anyone who wants extra space and privacy. Features a dedicated bedroom with ensuite, open-plan living room, and a full kitchen.',
    maxGuests: 3,
    bedrooms: 1,
    bathrooms: 1,
    amenities: [
      'High-Speed WiFi',
      'Air Conditioning (All Rooms)',
      'Smart TV / Netflix',
      'Fully Equipped Kitchen',
      'Dining Area',
      '24/7 Security',
      'Dedicated Parking',
      'Backup Generator',
      'Washing Machine',
      'Water Dispenser',
      'Iron & Ironing Board',
      'Premium Toiletries',
      'Clean Linens & Towels',
      'Workspace Desk',
    ],
    pricing: {
      night: 120000,
      week: 750000,
      month: 2500000,
    },
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=80',
    ],
    icalUrl: process.env.ICAL_URL_LEKKI_02 || '',
  },
};

module.exports = properties;
