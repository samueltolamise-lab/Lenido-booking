'use strict';

// Easter Sunday — Anonymous Gregorian Algorithm
function getEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// Nigerian fixed public holidays (month is 0-indexed)
const FIXED_HOLIDAYS = [
  { month: 0, day: 1 },    // New Year's Day
  { month: 4, day: 1 },    // Workers' Day
  { month: 5, day: 12 },   // Democracy Day
  { month: 9, day: 1 },    // Independence Day
  { month: 11, day: 25 },  // Christmas Day
  { month: 11, day: 26 },  // Boxing Day
];

function toDateOnly(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isPeakSeason(date) {
  const d = toDateOnly(date);
  const month = d.getMonth();
  const day = d.getDate();
  const year = d.getFullYear();

  // Entire December is peak
  if (month === 11) return true;

  // Fixed Nigerian public holidays
  for (const h of FIXED_HOLIDAYS) {
    if (month === h.month && day === h.day) return true;
  }

  // Easter period: Good Friday through Easter Monday
  const easter = getEaster(year);
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);

  if (d >= toDateOnly(goodFriday) && d <= toDateOnly(easterMonday)) return true;

  return false;
}

function isWeekendNight(date) {
  // Friday (5) and Saturday (6) nights
  const day = new Date(date).getDay();
  return day === 5 || day === 6;
}

function daysBetween(checkIn, checkOut) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((toDateOnly(checkOut) - toDateOnly(checkIn)) / msPerDay);
}

function isLastMinute(checkIn) {
  const now = Date.now();
  const checkInTime = toDateOnly(checkIn).getTime();
  const hoursUntil = (checkInTime - now) / (1000 * 60 * 60);
  return hoursUntil > 0 && hoursUntil <= 48;
}

function calculatePrice(property, checkIn, checkOut) {
  const nights = daysBetween(checkIn, checkOut);
  if (nights <= 0) throw new Error('Check-out must be after check-in');
  if (nights > 365) throw new Error('Stay cannot exceed 365 nights');

  const baseRate = property.pricing.night;
  const nightlyDetails = [];
  let subtotal = 0;

  const cursor = toDateOnly(checkIn);

  for (let i = 0; i < nights; i++) {
    let upliftRate = 0;
    const uplifts = [];

    if (isWeekendNight(cursor)) {
      upliftRate += 0.20;
      uplifts.push('Weekend +20%');
    }

    if (isPeakSeason(cursor)) {
      upliftRate += 0.35;
      uplifts.push('Peak Season +35%');
    }

    const nightRate = Math.round(baseRate * (1 + upliftRate));
    subtotal += nightRate;

    nightlyDetails.push({
      date: cursor.toISOString().split('T')[0],
      baseRate,
      rate: nightRate,
      uplifts,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  // Summarise which uplifts were applied
  const weekendNights = nightlyDetails.filter(n => n.uplifts.some(u => u.includes('Weekend'))).length;
  const peakNights = nightlyDetails.filter(n => n.uplifts.some(u => u.includes('Peak'))).length;

  const upliftSummary = [];
  if (weekendNights > 0) upliftSummary.push(`Weekend uplift (+20%) on ${weekendNights} night(s)`);
  if (peakNights > 0) upliftSummary.push(`Peak season uplift (+35%) on ${peakNights} night(s)`);

  // Long stay discount — applied to full subtotal
  let discountRate = 0;
  const discounts = [];

  if (nights >= 30) {
    discountRate = 0.20;
    discounts.push({
      reason: 'Long stay discount (30+ nights)',
      rate: '-20%',
      saving: Math.round(subtotal * 0.20),
    });
  } else if (nights >= 7) {
    discountRate = 0.10;
    discounts.push({
      reason: 'Long stay discount (7+ nights)',
      rate: '-10%',
      saving: Math.round(subtotal * 0.10),
    });
  }

  let total = Math.round(subtotal * (1 - discountRate));

  // Last minute discount — applied after long stay discount
  if (isLastMinute(checkIn)) {
    const lastMinuteSaving = Math.round(total * 0.15);
    total = Math.round(total * 0.85);
    discounts.push({
      reason: 'Last minute booking (within 48hrs)',
      rate: '-15%',
      saving: lastMinuteSaving,
    });
  }

  const totalSavings = discounts.reduce((sum, d) => sum + d.saving, 0);

  return {
    nights,
    baseRate,
    subtotal,
    upliftSummary,
    discounts,
    totalSavings,
    total,
    currency: 'NGN',
    nightlyDetails,
  };
}

module.exports = { calculatePrice, daysBetween, isLastMinute };
