# DateSpark ⚡
Website: https://datespark.live

Get a full date night plan in seconds. DateSpark is an AI-powered itinerary generator for busy couples, providing highly curated, location-accurate, and budget-aware date plans anywhere in the world.

## 🌟 Features

- **Instant Generation:** Creates up to 7 distinct chronological date variations instantly based on real Google Places data.
- **Dynamic Search Radius:** Select exactly how far you want to travel (1 Mile to 15+ Miles) to keep your Uber fares low and timing perfect.
- **Smart Booking Links:** 
  - **Restaurants & Desserts:** Automatically generates a pre-filled OpenTable deep-link with absolute guests and timings.
  - **Events & Entertainment:** Directs users to custom Google Search Query fallbacks dropping you onto ticketing aggregates seamlessly.
- **Custom AI mode ("Describe your perfect date idea"):** Full conversation flow allowing users to pitch any text prompts and iterate alternatives alongside context suggestions.
- **The Spark (Free) & DateSpark Plus Tiers:** 
  - **The Spark:** 1-2 Premium Date Ideas, 2-Stop Previews, and 2 saved favorites.
  - **DateSpark Plus:** Unlimited 5-Stop Itineraries, AI Customizer, 7-Day Recycle Bin, and priority features.
- **Smart Filtering:** Filter by budget, start/end times, date vibe, and specific personal interests effortlessly.
- **Multi-Neighborhood Builder:** Select up to 3 individual neighborhoods or districts for hyper-targeted location accuracy.

## Recent Updates 🚀

- **Premium Mobile & Global Audit (March 2026)**: Comprehensive site-wide audit neutralizing all "NYC" specific branding. Optimized typography, navigation, and feedback components for a premium mobile-first experience.
- **Unified Pricing Integration**: Synchronized all upgrade prompts to reflect the latest $1.99 (24h) and $9.99 (Monthly) pricing streams across the Dashboard and Generator.
- **Bulletproof Places Fail-safes**: Bypassed Places caching and incorporated automatic widened searches, removing budget filters or radius locks on Google failures.

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Lucide React
- **Backend:** Node.js, Express
- **Database:** Supabase (PostgreSQL)
- **Data Integrations:** Google Places API, `@react-google-maps/api`, Gemini AI (for Concept Ideation), Resend (Waitlist Onboarding Emails)

## 🚀 Getting Started

### Prerequisites

You need the following API keys:
- Supabase Project URL, Anon Key, and Service Role Key
- Google Cloud Platform key (Places API & Maps JavaScript API Enabled)
- Gemini API Key (If testing AI custom generators)
- Resend API Key (Optional, for onboarding email dispatches layout verify checks)

### Environment Variables

Create a `.env` file in the root directory with your keys:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GEMINI_API_KEY=your_gemini_api_key

# OPTIONAL for waitlist support
RESEND_API_KEY=your_resend_api_key
VITE_STRIPE_PUBLISHABLE_KEY=your publishable key
STRIPE_SECRET_KEY=Your secret key

PORT=5000
```

### Installation & Launch

1. Install dependencies:
```bash
npm install
```

2. Start the backend:
```bash
npm run server
# or run dev to launch concurrently
```

3. Start the dev layout (concurrent supports automatically):
```bash
npm run dev
```

## 📝 License

© 2026 DateSpark Inc. All rights reserved.
