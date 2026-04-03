# 💎 DateSpark | Premium AI Date Planner

[![Dynamic Design](https://img.shields.io/badge/Design-Premium-rose)](https://datespark.live)
[![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node%20%7C%20Supabase-blue)](https://datespark.live)
[![AI Powered](https://img.shields.io/badge/AI-Google%20Gemini-pink)](https://datespark.live)

**DateSpark** is the "Million Dollar" itinerary engine designed for high-intent couples in **New York City** and **Northern New Jersey**. It transforms the stress of planning into the magic of connection using state-of-the-art AI and real-time venue data.

---

## 🚀 Vision & Value Proposition

DateSpark isn't just a planner; it's a romantic companion. By combining **Google Gemini's** creative reasoning with **Google Places'** real-world verification, we provide itineraries that are both imaginative and logistically sound.

### Core Features:
- 🤖 **AI-Guided Planning**: Multi-stop date nights tailored to your "vibe," budget, and location.
- 📍 **Real-Time Veridicity**: Every venue is vetted via official Google data for ratings, photos, and current status.
- 💳 **Monetization Engine**: Production-ready **Stripe** integration for 24-Hour Passes ($1.99) and DateSpark Plus ($9.99/mo).
- 🔐 **Trust & Safety**: Built-in verification, safety tips, and a full legal suite (Privacy, Terms, Refunds, Cookies).
- 📧 **Retention Engine**: Automated "Weekend Spark" engagement emails via **Resend**.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React, Vite, Vanilla CSS, Lucide Icons |
| **Backend** | Node.js, Express (Secure API Proxy) |
| **Database & Auth** | Supabase (PostgreSQL) |
| **Intelligence** | Google Cloud (Vertex AI / Gemini 1.5) |
| **Geolocation** | Google Maps & Places API |
| **Payments** | Stripe (Live Mode Ready) |
| **Email** | Resend |

---

## ⚙️ Setup & Infrastructure

### 1. Environment Configuration
Create a `.env` file in the root directory with the following keys:

```env
# Server Config
PORT=5000
FRONTEND_URL=https://datespark.live
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# Client Config
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_GOOGLE_MAPS_API_KEY=...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# AI & Third Party
GEMINI_API_KEY=...
RESEND_API_KEY=...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Installation
```bash
npm install
```

### 3. Execution
```bash
# Start development server
npm run dev

# Start backend proxy
node server.js
```

---

## ⚖️ Legal & Compliance
DateSpark is built for scale and trust. Our legal framework includes:
*   [Privacy Policy](https://datespark.live/privacy)
*   [Terms of Service](https://datespark.live/terms)
*   [Refund Policy](https://datespark.live/refund-policy)
*   [Cookie Policy](https://datespark.live/cookie-policy)

---

## 👋 Support
Questions? Issues? Reach out to our team at **support@datespark.live**.

© 2026 DateSpark Inc. All rights reserved.
