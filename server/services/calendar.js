'use strict';

const ical = require('node-ical');
const properties = require('../config/properties');

// In-memory store: propertyId -> array of { start: Date, end: Date }
const blockedRanges = {};

function toDateOnly(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dateRangeToStrings(start, end) {
  const dates = [];
  const cursor = toDateOnly(start);
  const endDate = toDateOnly(end);

  while (cursor < endDate) {
    dates.push(cursor.toISOString().split('T')[0]);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

async function refreshPropertyCalendar(propertyId) {
  const property = properties[propertyId];
  if (!property || !property.icalUrl) return;

  try {
    const data = await ical.fromURL(property.icalUrl);
    const ranges = [];

    for (const event of Object.values(data)) {
      if (event.type !== 'VEVENT') continue;
      if (!event.start || !event.end) continue;

      // Skip events entirely in the past
      if (new Date(event.end) < new Date()) continue;

      ranges.push({ start: new Date(event.start), end: new Date(event.end) });
    }

    blockedRanges[propertyId] = ranges;
    console.log(`[Calendar] Refreshed ${propertyId}: ${ranges.length} blocked range(s)`);
  } catch (err) {
    console.error(`[Calendar] Failed to refresh ${propertyId}:`, err.message);
  }
}

async function refreshAllCalendars() {
  await Promise.all(Object.keys(properties).map(refreshPropertyCalendar));
}

// Returns a flat array of 'YYYY-MM-DD' strings that are blocked
function getBlockedDates(propertyId) {
  const ranges = blockedRanges[propertyId] || [];
  const dateSet = new Set();

  for (const { start, end } of ranges) {
    for (const d of dateRangeToStrings(start, end)) {
      dateSet.add(d);
    }
  }

  return Array.from(dateSet).sort();
}

// Check whether a date range [checkIn, checkOut) is fully available
function isRangeAvailable(propertyId, checkIn, checkOut) {
  const blocked = new Set(getBlockedDates(propertyId));
  const dates = dateRangeToStrings(checkIn, checkOut);
  return dates.every(d => !blocked.has(d));
}

// Called when a booking is confirmed — block those dates in memory immediately
// (until next iCal refresh overwrites with the authoritative source)
function blockDatesForBooking(propertyId, checkIn, checkOut, bookingId) {
  if (!blockedRanges[propertyId]) blockedRanges[propertyId] = [];
  blockedRanges[propertyId].push({
    start: new Date(checkIn),
    end: new Date(checkOut),
    bookingId,
  });
}

module.exports = {
  refreshAllCalendars,
  refreshPropertyCalendar,
  getBlockedDates,
  isRangeAvailable,
  blockDatesForBooking,
};
