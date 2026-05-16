'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');

const { router: bookingRouter, getPendingBookings } = require('./routes/bookings');
const { router: paymentRouter, injectPendingBookings } = require('./routes/payments');
const calendarRouter = require('./routes/calendar');
const { refreshAllCalendars } = require('./services/calendar');
const { getReviews, getSiteSettings, invalidateCache } = require('./services/sanity');

// Wire up the pending-bookings map between bookings and payments routes
injectPendingBookings(getPendingBookings);

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy — needed on Railway/Render for correct req.protocol
app.set('trust proxy', 1);

// Middleware
app.use(cors());

// Paystack webhook needs raw body — mount BEFORE express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api/bookings', bookingRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/calendar', calendarRouter);

// Expose public config to frontend (safe — no secrets)
app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    data: {
      paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
      whatsappNumber: process.env.HOST_WHATSAPP_NUMBER || '2348000000000',
    }
  });
});

// Keep old route for backwards compatibility
app.get('/api/config/public-key', (req, res) => {
  res.json({ success: true, data: { paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || '' } });
});

// Content API — reviews and site settings from Sanity
app.get('/api/content/reviews', async (req, res) => {
  try {
    const reviews = await getReviews();
    res.json({ success: true, data: reviews });
  } catch {
    res.json({ success: true, data: [] });
  }
});

app.get('/api/content/settings', async (req, res) => {
  try {
    const settings = await getSiteSettings();
    res.json({ success: true, data: settings });
  } catch {
    res.json({ success: true, data: null });
  }
});

// Sanity webhook — clears the content cache so changes go live immediately
app.post('/api/content/revalidate', (req, res) => {
  const secret = req.headers['x-revalidate-secret'];
  if (secret !== process.env.REVALIDATE_SECRET) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  invalidateCache();
  console.log('[Sanity] Cache invalidated via webhook.');
  res.json({ success: true, message: 'Cache cleared' });
});

// Health check (used by Railway)
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// SPA fallback — serve index.html for unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server and kick off calendar sync
app.listen(PORT, async () => {
  console.log(`Le Nido booking server running on port ${PORT}`);

  // Initial calendar fetch on startup
  await refreshAllCalendars();

  // Refresh every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    console.log('[Cron] Refreshing iCal calendars…');
    refreshAllCalendars();
  });
});

module.exports = app;
