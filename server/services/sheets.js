'use strict';

const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function getAuth() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
    ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: SCOPES,
  });
}

async function getSheetsClient() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

// Write to "Bookings" sheet
// Columns: Booking ID | Property | Guest Name | Phone | Email |
//          Check-in | Check-out | Nights | Total (₦) | Paystack Ref | Status | Date Created
async function appendBooking(booking) {
  const sheets = await getSheetsClient();
  const row = [
    booking.bookingId,
    booking.propertyName,
    booking.guestName,
    booking.guestPhone,
    booking.guestEmail,
    booking.checkIn,
    booking.checkOut,
    booking.nights,
    booking.total,
    booking.paystackRef,
    booking.status,
    new Date().toISOString(),
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: 'Bookings!A:L',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
}

// Write to "Guests" sheet
// Columns: Name | Phone | Email | Birthday Month | Property Stayed | Stay Date | Tags | Source
async function appendGuest(guest) {
  const sheets = await getSheetsClient();
  const row = [
    guest.name,
    guest.phone,
    guest.email,
    guest.birthdayMonth || '',
    guest.propertyStayed,
    guest.stayDate,
    guest.tags || 'Direct Booking',
    guest.source || 'lenido.com',
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: 'Guests!A:H',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
}

// Update booking status (e.g. from "pending" to "confirmed")
async function updateBookingStatus(paystackRef, status) {
  const sheets = await getSheetsClient();

  // Read Bookings sheet to find the row
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: 'Bookings!A:L',
  });

  const rows = response.data.values || [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][9] === paystackRef) { // column J = index 9 = Paystack Ref
      const rowNumber = i + 1;
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEETS_ID,
        range: `Bookings!K${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[status]] },
      });
      return true;
    }
  }
  return false;
}

module.exports = { appendBooking, appendGuest, updateBookingStatus };
