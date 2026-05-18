'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const { getProperties, getPropertyById } = require('../services/sanity');
const { calculatePrice } = require('../services/pricing');
const { initializeTransaction } = require('../services/paystack');
const { isRangeAvailable } = require('../services/calendar');

// In-memory store for pending bookings (keyed by Paystack reference)
// These are promoted to "confirmed" by the payment webhook/verify endpoint
const pendingBookings = new Map();

function getPendingBookings() {
  return pendingBookings;
}

// GET /api/bookings/properties
router.get('/properties', async (req, res) => {
  try {
    const list = await getProperties();
    res.json({ success: true, data: list });
  } catch (err) {
    console.error('[Bookings] getProperties error:', err.message);
    res.status(500).json({ success: false, error: 'Could not load properties' });
  }
});

// GET /api/bookings/properties/:id
router.get('/properties/:id', async (req, res) => {
  try {
    const property = await getPropertyById(req.params.id);
    if (!property) return res.status(404).json({ success: false, error: 'Property not found' });
    res.json({ success: true, data: property });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not load property' });
  }
});

// GET /api/bookings/pricing/:propertyId?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD
router.get('/pricing/:propertyId', async (req, res) => {
  const property = await getPropertyById(req.params.propertyId);
  if (!property) return res.status(404).json({ success: false, error: 'Property not found' });

  const { checkIn, checkOut } = req.query;
  if (!checkIn || !checkOut) {
    return res.status(400).json({ success: false, error: 'checkIn and checkOut are required' });
  }

  try {
    const breakdown = calculatePrice(property, checkIn, checkOut);
    res.json({ success: true, data: breakdown });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/bookings/initialize
// Body: { propertyId, checkIn, checkOut, guestName, guestEmail, guestPhone, specialRequests }
router.post('/initialize', async (req, res) => {
  const { propertyId, checkIn, checkOut, guestName, guestEmail, guestPhone, specialRequests } = req.body;

  // Validate required fields
  if (!propertyId || !checkIn || !checkOut || !guestName || !guestEmail || !guestPhone) {
    return res.status(400).json({ success: false, error: 'Missing required booking fields' });
  }

  const property = await getPropertyById(propertyId);
  if (!property) return res.status(404).json({ success: false, error: 'Property not found' });

  // Validate date format
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  if (isNaN(checkInDate) || isNaN(checkOutDate)) {
    return res.status(400).json({ success: false, error: 'Invalid date format. Use YYYY-MM-DD' });
  }
  if (checkInDate <= new Date()) {
    return res.status(400).json({ success: false, error: 'Check-in must be in the future' });
  }
  if (checkOutDate <= checkInDate) {
    return res.status(400).json({ success: false, error: 'Check-out must be after check-in' });
  }

  // Minimum night stay check
  const { daysBetween } = require('../services/pricing');
  const requestedNights = daysBetween(checkIn, checkOut);
  const minNights = property.minimumNights || 2;
  if (requestedNights < minNights) {
    return res.status(400).json({
      success: false,
      error: `Minimum stay is ${minNights} night${minNights > 1 ? 's' : ''} for this property.`,
    });
  }

  // Availability check
  if (!isRangeAvailable(propertyId, checkIn, checkOut)) {
    return res.status(409).json({ success: false, error: 'Selected dates are not available' });
  }

  // Price calculation
  let pricing;
  try {
    pricing = calculatePrice(property, checkIn, checkOut);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }

  // Generate booking reference
  const bookingId = `LN-${checkIn.replace(/-/g, '')}-${uuidv4().slice(0, 6).toUpperCase()}`;
  const paystackRef = `lenido-${uuidv4().replace(/-/g, '').slice(0, 16)}`;

  const callbackUrl = `${req.protocol}://${req.get('host')}/confirmation.html?ref=${paystackRef}`;

  // Initialize Paystack transaction
  let paystackData;
  try {
    paystackData = await initializeTransaction({
      email: guestEmail,
      amountNGN: pricing.total,
      reference: paystackRef,
      metadata: {
        bookingId,
        propertyId,
        propertyName: property.name,
        guestName,
        guestPhone,
        checkIn,
        checkOut,
        nights: pricing.nights,
        custom_fields: [
          { display_name: 'Property', variable_name: 'property', value: property.name },
          { display_name: 'Check-in', variable_name: 'check_in', value: checkIn },
          { display_name: 'Check-out', variable_name: 'check_out', value: checkOut },
        ],
      },
      callbackUrl,
    });
  } catch (err) {
    console.error('[Bookings] Paystack init error:', err.message);
    return res.status(502).json({ success: false, error: 'Payment gateway error. Please try again.' });
  }

  // Store pending booking
  pendingBookings.set(paystackRef, {
    bookingId,
    propertyId,
    propertyName: property.name,
    guestName,
    guestEmail,
    guestPhone,
    specialRequests: specialRequests || '',
    checkIn,
    checkOut,
    nights: pricing.nights,
    total: pricing.total,
    pricing,
    paystackRef,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    data: {
      bookingId,
      reference: paystackRef,
      accessCode: paystackData.access_code,
      authorizationUrl: paystackData.authorization_url,
      amount: pricing.total,
      pricing,
    },
  });
});

module.exports = { router, getPendingBookings };
