'use strict';

const express = require('express');
const router = express.Router();

const properties = require('../config/properties');
const { getBlockedDates, isRangeAvailable, refreshPropertyCalendar } = require('../services/calendar');

// GET /api/calendar/:propertyId/blocked-dates
// Returns a flat array of YYYY-MM-DD strings that flatpickr should disable
router.get('/:propertyId/blocked-dates', (req, res) => {
  const { propertyId } = req.params;
  if (!properties[propertyId]) {
    return res.status(404).json({ success: false, error: 'Property not found' });
  }

  const blocked = getBlockedDates(propertyId);
  res.json({ success: true, data: blocked });
});

// GET /api/calendar/:propertyId/availability?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD
router.get('/:propertyId/availability', (req, res) => {
  const { propertyId } = req.params;
  const { checkIn, checkOut } = req.query;

  if (!properties[propertyId]) {
    return res.status(404).json({ success: false, error: 'Property not found' });
  }

  if (!checkIn || !checkOut) {
    return res.status(400).json({ success: false, error: 'checkIn and checkOut required' });
  }

  const available = isRangeAvailable(propertyId, checkIn, checkOut);
  res.json({ success: true, data: { available } });
});

// POST /api/calendar/:propertyId/refresh  — manual trigger (admin use)
router.post('/:propertyId/refresh', async (req, res) => {
  const { propertyId } = req.params;
  if (!properties[propertyId]) {
    return res.status(404).json({ success: false, error: 'Property not found' });
  }

  await refreshPropertyCalendar(propertyId);
  const blocked = getBlockedDates(propertyId);
  res.json({ success: true, data: { propertyId, blockedCount: blocked.length } });
});

module.exports = router;
