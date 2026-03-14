<<<<<<< HEAD
# DateSpark
Modern couples often struggle with planning meaningful dates due to time constraints and decision fatigue. DateSpark solves this by instantly generating curated date itineraries using real location data and AI.
=======
# DateSpark ⚡

Get a full date night plan in seconds. DateSpark is an AI-powered itinerary generator for busy couples, providing highly curated, location-accurate, and budget-aware date plans in New York City.

## 🌟 Features

- **Instant Generation:** Creates 7 distinct chronological date variations instantly based on real Google Places data.
- **Smart Filtering:** Filter by budget, start/end times, date vibe, and specific personal interests.
- **Customization Context:** You can enter custom activities manually and the generation engine will seamlessly weave them into your generated timeline.
- **Freemium Tiers:** Free users enjoy 3 plans with up to 2 stops. Premium users unlock all 7 options, comprehensive 5-step itineraries, direct Google Maps directions, and Uber ride deep-links.
- **Calendar Date Tracking:** Keep an organizational record of exactly when your dates are taking place.

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Lucide React
- **Backend:** Node.js, Express
- **Database:** Supabase (PostgreSQL)
- **Data Integrations:** Google Places API, `@react-google-maps/api`

## 🚀 Getting Started

### Prerequisites

You need the following API keys:
- Supabase Project URL, Anon Key, and Service Role Key
- Google Cloud Platform key (Places API & Maps JavaScript API Enabled)

### Environment Variables

Create a `.env` file in the root directory with your keys:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

PORT=5000
```

### Installation & Launch

1. Install dependencies:
```bash
npm install
```

2. Start the backend server:
```bash
node server.js
```

3. In a new terminal tab, start the frontend development server:
```bash
npm run dev
```

## 📝 License

© 2026 DateSpark SaaS. All rights reserved.
