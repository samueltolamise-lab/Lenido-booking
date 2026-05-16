'use strict';

const express = require('express');
const router = express.Router();

const { verifyTransaction, verifyWebhookSignature } = require('../services/paystack');
const { appendBooking, appendGuest } = require('../services/sheets');
const { notifyGuestBookingConfirmed, notifyHostNewBooking } = require('../services/whatsapp');
const { blockDatesForBooking } = require('../services/calendar');

// Will be injected by index.js to avoid circular deps
let getPendingBookings;
const confirmedRefs = new Set(); // idempotency guard

function injectPendingBookings(fn) {
  getPendingBookings = fn;
}

async function confirmBooking(booking) {
  if (confirmedRefs.has(booking.paystackRef)) {
    console.log(`[Payments] Already confirmed: ${booking.paystackRef}`);
    return;
  }
  confirmedRefs.add(booking.paystackRef);

  booking.status = 'confirmed';

  // Block dates in memory immediately
  blockDatesForBooking(booking.propertyId, booking.checkIn, booking.checkOut, booking.bookingId);

  // Write to Google Sheets (non-blocking — log failure but don't fail the response)
  Promise.all([
    appendBooking(booking).catch(err => console.error('[Sheets] appendBooking failed:', err.message)),
    appendGuest({
      name: booking.guestName,
      phone: booking.guestPhone,
      email: booking.guestEmail,
      propertyStayed: booking.propertyName,
      stayDate: booking.checkIn,
      source: 'lenido.com',
    }).catch(err => console.error('[Sheets] appendGuest failed:', err.message)),
  ]);

  // Send WhatsApp notifications (non-blocking)
  Promise.all([
    notifyGuestBookingConfirmed(booking),
    notifyHostNewBooking(booking),
  ]);

  console.log(`[Payments] Booking confirmed: ${booking.bookingId}`);
}

// POST /api/payments/webhook  — Paystack posts here after payment
// Must return 200 quickly; processing is async
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-paystack-signature'];

  if (!verifyWebhookSignature(req.body, signature)) {
    console.warn('[Webhook] Invalid signature');
    return res.status(401).send('Invalid signature');
  }

  res.sendStatus(200); // Acknowledge immediately

  let event;
  try {
    event = JSON.parse(req.body.toString());
  } catch {
    return;
  }

  if (event.event !== 'charge.success') return;

  const ref = event.data?.reference;
  const pendingBookings = getPendingBookings();
  const booking = pendingBookings.get(ref);

  if (!booking) {
    console.warn(`[Webhook] No pending booking for ref: ${ref}`);
    return;
  }

  await confirmBooking(booking);
  pendingBookings.delete(ref);
});

// GET /api/payments/verify/:reference  — called by frontend after Paystack popup success
router.get('/verify/:reference', async (req, res) => {
  const { reference } = req.params;
  const pendingBookings = getPendingBookings();
  const booking = pendingBookings.get(reference);

  if (!booking) {
    // Could already be confirmed via webhook
    if (confirmedRefs.has(reference)) {
      return res.json({ success: true, data: { status: 'confirmed', reference } });
    }
    return res.status(404).json({ success: false, error: 'Booking not found' });
  }

  // Verify with Paystack
  let paystackData;
  try {
    paystackData = await verifyTransaction(reference);
  } catch (err) {
    return res.status(502).json({ success: false, error: 'Payment verification failed' });
  }

  if (paystackData.status !== 'success') {
    return res.status(402).json({ success: false, error: 'Payment not completed', status: paystackData.status });
  }

  // Amount check (kobo to naira)
  const paidAmountNGN = paystackData.amount / 100;
  if (paidAmountNGN < booking.total) {
    return res.status(402).json({
      success: false,
      error: `Underpayment detected. Expected ₦${booking.total.toLocaleString()}, received ₦${paidAmountNGN.toLocaleString()}`,
    });
  }

  await confirmBooking(booking);
  pendingBookings.delete(reference);

  res.json({
    success: true,
    data: {
      status: 'confirmed',
      bookingId: booking.bookingId,
      propertyName: booking.propertyName,
      guestName: booking.guestName,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: booking.nights,
      total: booking.total,
      reference,
    },
  });
});

module.exports = { router, injectPendingBookings };
