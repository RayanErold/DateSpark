# DateSpark ⚡
Website: https://datespark.live

Get a full date night plan in seconds. DateSpark is an AI-powered itinerary generator for busy couples, providing highly curated, location-accurate, and budget-aware date plans anywhere in the world.

## 🌟 Key Features

- **Instant Generation:** Creates chronological date plans based on real Google Places data.
- **Dual Planning Modes**:
  - **Classic ("Create My Own")**: Quick, location-targeted filters.
  - **Guided Builder (AI)**: Natural language prompts for a personalized touch.
- **Subscription & Monetization**:
  - **The Spark (Free)**: 3 Classic and 5 Guided plans per day.
  - **24-Hour Pass ($1.99)**: Unlimited access for 24 hours (One-time payment).
  - **DateSpark Elite ($9.99/mo)**: Unlimited access with a **30-Day Free Trial**.
- **100% Reliability**: Integrated **Stripe Webhooks** ensure automated upgrades even if the user closes the browser during checkout.
- **Smart Booking Links**: Auto-generated OpenTable links and event ticketing search fallbacks.
- **Multi-Neighborhood Selection**: Target specific NYC vibes (SoHo, Chelsea, Williamsburg, etc.).

## 🚀 Recent Updates (April 2026)

- **Backend Usage Enforcement**: Replaced client-side tracking with secure server-side limits (3 Classic / 5 Guided per day).
- **Stripe Webhook Integration**: Automated membership syncing via secure Stripe webhook events (`checkout.session.completed`, etc.).
- **30-Day Free Trial**: Introduced a risk-free trial for the Elite Membership tier.
- **Metadata Analytics**: Implemented a "Metadata Bridge" between Stripe and Supabase for precise user tracking.
- **Production URL Sync**: Configured production environment variables for seamless live domain redirects.

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Lucide React
- **Backend:** Node.js, Express
- **Database:** Supabase (PostgreSQL)
- **Integrations:** Google Places API, Gemini AI, Stripe (Billing), Resend (Emails)

## 🚀 Getting Started

### Prerequisites

You need the following API keys:
- **Supabase**: URL, Anon Key, and Service Role Key (for Webhooks)
- **Google Cloud**: Places API & Maps JavaScript API
- **Stripe**: Secret Key, Publishable Key, and **Webhook Secret**
- **Gemini**: API Key for AI generation

### Environment Variables

Create a `.env` file in the root directory:

```env
# Infrastructure
PORT=5005
FRONTEND_URL=https://datespark.live
VITE_APP_URL=https://datespark.live

# Supabase
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Google & AI
VITE_GOOGLE_MAPS_API_KEY=your_google_key
GEMINI_API_KEY=your_gemini_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...
```

### Installation & Launch

1. Install dependencies: `npm install`
2. Start the app: `npm run dev`

## 📝 License

© 2026 DateSpark Inc. All rights reserved.
