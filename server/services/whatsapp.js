'use strict';

const axios = require('axios');

function formatNGN(amount) {
  return '₦' + Number(amount).toLocaleString('en-NG');
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

async function sendWebhook(payload) {
  const webhookUrl = process.env.MAKE_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('[WhatsApp] MAKE_WEBHOOK_URL not set — skipping notification');
    return;
  }

  await axios.post(webhookUrl, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
  });
}

async function notifyGuestBookingConfirmed(booking) {
  const payload = {
    type: 'guest_confirmation',
    to: booking.guestPhone,
    guestName: booking.guestName,
    propertyName: booking.propertyName,
    checkIn: formatDate(booking.checkIn),
    checkOut: formatDate(booking.checkOut),
    nights: booking.nights,
    total: formatNGN(booking.total),
    bookingId: booking.bookingId,
    message:
      `Hi ${booking.guestName}! 🎉 Your booking at ${booking.propertyName} is confirmed.\n\n` +
      `📅 Check-in: ${formatDate(booking.checkIn)}\n` +
      `📅 Check-out: ${formatDate(booking.checkOut)}\n` +
      `🌙 Nights: ${booking.nights}\n` +
      `💰 Total paid: ${formatNGN(booking.total)}\n\n` +
      `We will send you check-in details 24 hours before your arrival. ` +
      `If you have any questions, reply to this message. Welcome to Le Nido! 🏡`,
  };

  try {
    await sendWebhook(payload);
    console.log(`[WhatsApp] Guest confirmation sent to ${booking.guestPhone}`);
  } catch (err) {
    console.error('[WhatsApp] Guest notification failed:', err.message);
  }
}

async function notifyHostNewBooking(booking) {
  const payload = {
    type: 'host_alert',
    to: process.env.HOST_WHATSAPP_NUMBER,
    guestName: booking.guestName,
    guestPhone: booking.guestPhone,
    guestEmail: booking.guestEmail,
    propertyName: booking.propertyName,
    checkIn: formatDate(booking.checkIn),
    checkOut: formatDate(booking.checkOut),
    nights: booking.nights,
    total: formatNGN(booking.total),
    bookingId: booking.bookingId,
    paystackRef: booking.paystackRef,
    message:
      `🔔 New Booking Alert!\n\n` +
      `Guest: ${booking.guestName}\n` +
      `Phone: ${booking.guestPhone}\n` +
      `Email: ${booking.guestEmail}\n` +
      `Property: ${booking.propertyName}\n` +
      `📅 ${formatDate(booking.checkIn)} → ${formatDate(booking.checkOut)}\n` +
      `🌙 ${booking.nights} night(s)\n` +
      `💰 ${formatNGN(booking.total)} received\n` +
      `Ref: ${booking.paystackRef}`,
  };

  try {
    await sendWebhook(payload);
    console.log(`[WhatsApp] Host alert sent`);
  } catch (err) {
    console.error('[WhatsApp] Host notification failed:', err.message);
  }
}

module.exports = { notifyGuestBookingConfirmed, notifyHostNewBooking };
