# Le Nido — Your To-Do List

Things that require your action before the site goes fully live.
Tick these off as you complete them.

---

## 🔴 Blocking (site won't work without these)

### 1. Sanity CMS — One-time setup
Your content studio is ready. You just need to link it to a Sanity account.

- [ ] Go to **https://sanity.io** → sign up for a free account
- [ ] Click **New Project** → name it `Le Nido` → dataset: `production`
- [ ] Copy your **Project ID** (looks like `abc12def`)
- [ ] Open your `.env` file and set:
  ```
  SANITY_PROJECT_ID=your_project_id_here
  ```
- [ ] In Terminal, go into the `studio/` folder and run:
  ```bash
  cd lenido-booking/studio
  npm install
  npm run dev
  ```
  → This opens the Studio at **http://localhost:3333**
- [ ] In the Studio: go to **Properties** and add your two properties with real descriptions and photos
- [ ] Deploy the Studio publicly (so you can edit from anywhere):
  ```bash
  npm run deploy
  ```
  → Sanity will give you a URL like `lenido.sanity.studio`

---

### 2. Server dependencies
Run this in the main project folder to install `@sanity/client`:
```bash
cd lenido-booking
npm install
```

---

### 3. Paystack
- [ ] Replace placeholder keys in `.env`:
  ```
  PAYSTACK_SECRET_KEY=sk_live_your_real_key
  PAYSTACK_PUBLIC_KEY=pk_live_your_real_key
  ```
- [ ] In your Paystack dashboard → set the **callback URL** to:
  `https://yourdomain.com/confirmation.html`

---

## 🟡 Important (do soon)

### 4. Property photos
- [ ] Compress your photos at **https://squoosh.app** (target: under 400KB each)
- [ ] Name them using the convention:
  - `lekki-01-hero-01.jpg`, `lekki-01-living-01.jpg`, etc.
  - `lekki-02-hero-01.jpg`, `lekki-02-bedroom-01.jpg`, etc.
- [ ] Drop them into:
  - `public/assets/properties/lekki-01/`
  - `public/assets/properties/lekki-02/`
- [ ] Upload the same photos to Sanity (drag & drop in the Studio)
  → Tell Claude once done — he'll update the fallback image paths in the code

### 5. Brand assets
- [ ] Drop your logo files into `brand/logos/`:
  - `logo-primary.svg` (for dark backgrounds)
  - `logo-light.svg` (for light backgrounds)
  - `favicon.ico`
  → Tell Claude once done — he'll wire the logo into the header & favicon

### 6. WhatsApp number
- [ ] Open `content.json` and update `"whatsappNumber"` to your real number
  (format: `2348012345678` — no `+`, no spaces)

---

## 🟢 Nice to have (before launch)

### 7. iCal sync (Airbnb / Booking.com)
- [ ] In Airbnb: Listing → Availability → Export Calendar → copy the `.ics` URL
- [ ] Add to `.env`:
  ```
  ICAL_URL_LEKKI_01=https://www.airbnb.com/calendar/ical/...
  ICAL_URL_LEKKI_02=https://www.airbnb.com/calendar/ical/...
  ```
  (or add the URL directly in the Sanity Studio → Property → iCal URL field)

### 8. Google Sheets (booking log)
- [ ] Create a Google Sheet with two tabs: `Bookings` and `Guests`
- [ ] Set up a Google Service Account (Claude can walk you through this)
- [ ] Add the credentials to `.env`:
  ```
  GOOGLE_SHEETS_ID=your_sheet_id
  GOOGLE_SERVICE_ACCOUNT_EMAIL=...
  GOOGLE_PRIVATE_KEY=...
  ```

### 9. Domain & hosting
- [ ] Buy your domain (e.g. `lenido.com` or `lenídobondd.com`)
- [ ] Deploy to **Railway** (already configured — `railway.toml` is in the project)
  → Tell Claude when ready and he'll walk you through the Railway deploy

### 10. Sanity live revalidation (optional but nice)
So the website updates instantly when you publish in Sanity:
- [ ] Set a secret string in `.env`: `REVALIDATE_SECRET=any_random_string`
- [ ] In Sanity dashboard → API → Webhooks → add:
  - URL: `https://yourdomain.com/api/content/revalidate`
  - HTTP Header: `x-revalidate-secret: your_secret`
  - Trigger: on publish

---

*Last updated: May 2025 · Built with Claude (Cowork)*
