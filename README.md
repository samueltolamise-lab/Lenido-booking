# Le Nido by Bondd — Direct Booking System

A complete direct booking web application for Le Nido by Bondd short-term rentals in Lagos, Nigeria.

---

## Features

- Property listings with photo gallery, amenities, and pricing
- Real-time availability calendar (iCal sync with Airbnb / Booking.com every 15 min)
- Dynamic pricing engine — weekend uplifts, peak season, long-stay discounts, last-minute discounts
- Paystack inline payment popup (cards, bank transfer, USSD)
- Server-side payment verification via Paystack webhook
- Google Sheets database (Bookings + Guests sheets)
- WhatsApp notifications to guest and host via Make.com webhook
- No double bookings — dates blocked immediately on confirmation
- Deployable on Railway or Render free tier

---

## Local Setup

### Prerequisites

- Node.js 18+
- A Paystack account (live or test)
- A Google Cloud project with Sheets API enabled
- A Make.com account with a webhook scenario

---

### 1. Clone and install

```bash
cd lenido-booking
npm install
```

---

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in every value (see sections below for how to get each one).

---

### 3. Paystack Keys

1. Log into [dashboard.paystack.com](https://dashboard.paystack.com)
2. Go to **Settings → API Keys & Webhooks**
3. Copy your **Secret Key** → `PAYSTACK_SECRET_KEY`
4. Copy your **Public Key** → `PAYSTACK_PUBLIC_KEY`
5. Set your **Webhook URL** to `https://your-domain.com/api/payments/webhook`
   - On Railway/Render this will be your deployed URL
   - For local testing use [ngrok](https://ngrok.com): `ngrok http 3000`

> Use **test keys** (`sk_test_...`, `pk_test_...`) during development. Switch to live keys for production.

---

### 4. Google Sheets API

#### 4a. Create the spreadsheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet
2. Name the first sheet tab **Bookings** and add these headers in row 1:

   | A | B | C | D | E | F | G | H | I | J | K | L |
   |---|---|---|---|---|---|---|---|---|---|---|---|
   | Booking ID | Property | Guest Name | Phone | Email | Check-in | Check-out | Nights | Total (₦) | Paystack Ref | Status | Date Created |

3. Add a second sheet tab named **Guests** with these headers in row 1:

   | A | B | C | D | E | F | G | H |
   |---|---|---|---|---|---|---|---|
   | Name | Phone | Email | Birthday Month | Property Stayed | Stay Date | Tags | Source |

4. Copy the spreadsheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/`**`THIS_IS_THE_ID`**`/edit`
   → `GOOGLE_SHEETS_ID`

#### 4b. Create a Service Account

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Enable the **Google Sheets API**: APIs & Services → Library → search "Sheets" → Enable
4. Go to **APIs & Services → Credentials → Create Credentials → Service Account**
5. Give it a name (e.g. `lenido-booking`) and click **Done**
6. Click the service account → **Keys** tab → **Add Key → Create new key → JSON**
7. Download the JSON file — it contains `client_email` and `private_key`

#### 4c. Fill in .env

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=the-client_email-from-the-json-file
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
```

> **Important:** The private key in the JSON file has literal `\n` characters. In your `.env` file, keep them as `\n` (do not expand to real newlines). The server handles the conversion automatically.

#### 4d. Share the sheet with the service account

1. Open your Google Sheet
2. Click **Share**
3. Paste the service account email (from the JSON, ends in `.iam.gserviceaccount.com`)
4. Give it **Editor** access
5. Click **Send** (ignore the "email can't receive" warning)

---

### 5. iCal Calendar Sync

For each property, get the iCal export URL from Airbnb or Booking.com:

**Airbnb:**
- Go to your listing → **Calendar** → **Availability settings** → **Sync calendars** → **Export calendar**
- Copy the `.ics` URL

**Booking.com:**
- Go to your property → **Calendar** → **iCal** → **Export**
- Copy the `.ics` URL

Add these to `.env`:
```
ICAL_URL_LEKKI_01=https://www.airbnb.com/calendar/ical/...
ICAL_URL_LEKKI_02=https://www.airbnb.com/calendar/ical/...
```

The server refreshes these every 15 minutes automatically.

---

### 6. WhatsApp Notifications via Make.com

1. Log into [make.com](https://make.com) and create a new Scenario
2. Add a **Webhooks → Custom webhook** trigger
3. Copy the webhook URL → `MAKE_WEBHOOK_URL`
4. After the webhook, add a **ManyChat** (or Twilio / WhatsApp Business) action to send a message
5. Map the payload fields:
   - Guest notification: use `type === "guest_confirmation"` → send `message` to `to` (the guest phone)
   - Host notification: use `type === "host_alert"` → send `message` to the host number

The webhook payload structure:
```json
{
  "type": "guest_confirmation | host_alert",
  "to": "2348012345678",
  "guestName": "Amara Johnson",
  "propertyName": "Le Nido Lekki 01",
  "checkIn": "Monday, 2 June 2026",
  "checkOut": "Friday, 6 June 2026",
  "nights": 4,
  "total": "₦340,000",
  "bookingId": "LN-20260602-A3F9B1",
  "message": "Full formatted WhatsApp message here"
}
```

Set `HOST_WHATSAPP_NUMBER` to your WhatsApp number in international format (e.g. `2348012345678` — no `+`).

---

### 7. Run locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

### 8. Adding / updating properties

Edit [`server/config/properties.js`](server/config/properties.js). Each property has:

```js
'property-id': {
  id: 'property-id',
  name: 'Display Name',
  type: 'Studio | 1 Bedroom | 2 Bedroom',
  location: 'Lekki Phase 1, Lagos',
  tagline: 'Short tagline shown on card',
  description: 'Full paragraph description',
  maxGuests: 2,
  bedrooms: 0,
  bathrooms: 1,
  amenities: ['WiFi', 'Air Conditioning', ...],
  pricing: {
    night: 85000,    // ₦ per night (base rate for pricing engine)
    week: 530000,    // displayed only
    month: 1800000,  // displayed only
  },
  images: ['https://...', '...'],   // First image is the hero
  icalUrl: process.env.ICAL_URL_PROPERTY_ID || '',
}
```

---

## Dynamic Pricing Rules

The pricing engine in [`server/services/pricing.js`](server/services/pricing.js) applies rules in this order:

| Rule | Condition | Effect |
|------|-----------|--------|
| Weekend uplift | Friday or Saturday night | +20% on that night |
| Peak season uplift | December, Easter (Good Fri–Easter Mon), Nigerian public holidays | +35% on that night |
| Long stay discount | 7–29 nights | −10% off total |
| Long stay discount | 30+ nights | −20% off total |
| Last minute discount | Check-in within 48 hours, and stay not yet booked | −15% off total |

Weekend and peak uplifts are additive per night. Discounts apply to the total after all nightly rates are summed.

---

## Deployment on Railway

### Option A — Deploy from GitHub

1. Push this folder to a GitHub repo
2. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**
3. Select your repo
4. Railway auto-detects Node.js via `railway.toml`
5. Go to **Variables** and add all `.env` values
6. Your app is live at `https://your-app.railway.app`

### Option B — Deploy with Railway CLI

```bash
npm install -g @railway/cli
railway login
railway init
railway up
railway variables set PAYSTACK_SECRET_KEY=sk_live_...
# Set all other variables the same way
```

### After deploying

- Update `PAYSTACK_WEBHOOK_URL` in your Paystack dashboard to `https://your-app.railway.app/api/payments/webhook`
- Test a full booking with a Paystack test card: `4084 0840 8408 4081`, CVV `408`, Expiry any future date, PIN `0000`

---

## Deployment on Render (alternative)

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo
3. Set:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Add all `.env` variables under **Environment Variables**
4. Deploy

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings/properties` | List all properties |
| GET | `/api/bookings/properties/:id` | Get single property |
| GET | `/api/pricing/:propertyId?checkIn=&checkOut=` | Get itemised price breakdown |
| POST | `/api/bookings/initialize` | Create pending booking + init Paystack |
| GET | `/api/payments/verify/:reference` | Verify payment + confirm booking |
| POST | `/api/payments/webhook` | Paystack webhook (called by Paystack) |
| GET | `/api/calendar/:propertyId/blocked-dates` | Get blocked date strings for date picker |
| GET | `/api/calendar/:propertyId/availability?checkIn=&checkOut=` | Check if range is free |
| POST | `/api/calendar/:propertyId/refresh` | Force iCal refresh for a property |
| GET | `/health` | Server health check |

---

## Project Structure

```
lenido-booking/
├── public/                  # Static frontend
│   ├── index.html           # Property listing page
│   ├── property.html        # Property detail + booking form
│   ├── confirmation.html    # Post-payment confirmation
│   ├── css/style.css
│   └── js/
│       ├── main.js          # Property listing logic
│       ├── booking.js       # Date picker, pricing, form
│       └── payment.js       # Paystack popup handler
├── server/
│   ├── index.js             # Express app + cron
│   ├── config/
│   │   └── properties.js    # Property definitions
│   ├── routes/
│   │   ├── bookings.js      # /api/bookings/*
│   │   ├── payments.js      # /api/payments/*
│   │   └── calendar.js      # /api/calendar/*
│   └── services/
│       ├── pricing.js       # Dynamic pricing engine
│       ├── paystack.js      # Paystack API wrapper
│       ├── sheets.js        # Google Sheets read/write
│       ├── calendar.js      # iCal fetch + in-memory store
│       └── whatsapp.js      # Make.com webhook sender
├── .env.example
├── package.json
├── railway.toml
└── README.md
```
