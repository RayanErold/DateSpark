# DateSpark ⚡
Website: https://datespark.onrender.com

Get a full date night plan in seconds. DateSpark is an AI-powered itinerary generator for busy couples, providing highly curated, location-accurate, and budget-aware date plans in New York City.

## 🌟 Features

- **Instant Generation:** Creates up to 7 distinct chronological date variations instantly based on real Google Places data.
- **Dynamic Search Radius:** Select exactly how far you want to travel (1 Mile to 15+ Miles) to keep your Uber fares low and timing perfect.
- **Smart Booking Links:** 
  - **Restaurants & Desserts:** Automatically generates a pre-filled OpenTable deep-link with absolute guests and timings.
  - **Events & Entertainment:** Directs users to custom Google Search Query fallbacks dropping you onto ticketing aggregates seamlessly.
- **Custom AI mode ("Describe your perfect date idea"):** Full conversation flow allowing users to pitch any text prompts and iterate alternatives alongside context suggestions.
- **Freemium Tiers with 24h Rolling Reset:** 
  - Free users receive 2 custom generation iterations. Count resets automatically every 24 hours using rolling timestamp decay checks.
- **Smart Filtering:** Filter by budget, start/end times, date vibe, and specific personal interests effortlessly.
- **Multi-Neighborhood Builder:** Select up to 3 individual neighborhoods (e.g., *Soho, Chelsea, Williamsburg*) for hyper-targeted location accuracy.

## Recent Updates 🚀

- **Redesigned Dashboard Upgrade Modal**: Updated the modal grid to support 4 highly requested pricing streams: Elite ($99), Lifetime ($29.99), Premium ($12/mo), and Daily pass ($1.99).
- **Bulletproof Places Fail-safes**: Bypassed Places caching and incorporated automatic widened searches removing budget filters or radius locks on Google failures, absolutely preventing repetitive placeholder loopsNode triggers setup.

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
