# 💎 DateSpark | Premium AI Date Planner

[![Dynamic Design](https://img.shields.io/badge/Design-Premium-rose)](https://datespark.live)
[![Tech Stack](https://img.shields.io/badge/Stack-React%2019%20%7C%20Node%20%7C%20Python-blue)](https://datespark.live)
[![AI Powered](https://img.shields.io/badge/AI-Gemini%202.5%20Pro-pink)](https://datespark.live)
[![Architecture](https://img.shields.io/badge/Architecture-Microservices-orange)](https://datespark.live)

**DateSpark** is a high-performance social discovery platform that leverages state-of-the-art AI to orchestrate curated real-life experiences.

Supported in NYC & NJ Now
---

## 👋 The Experience

### 🤖 AI-Guided Planning
Multi-stop date nights tailored to your "vibe," budget, and location using **Google Gemini 2.5 Pro** for industry-leading reasoning and creativity.

### 📱 Mastered Mobile Layout
Optimized for the modern iPhone and Android experience:
- **Fixed Header Architecture**: Smooth, persistent navigation that respects device "Safe Areas" (notches).
- **Responsive Itinerary Cards**: Dynamic `snap-alignment` grid that eliminates whitespace gaps and provides a "peek" into upcoming plans.
- **Micro-Animations**: Glassmorphism and ambient glow effects for a premium, native-app feel.

### 📍 Local Intelligence & Event Discovery
DateSpark features a custom **Hybrid Discovery Engine** that goes beyond basic map data to find real-time, high-intent local activities:
- **Multi-Source Aggregation**: Seamlessly merges live data from **Ticketmaster**, **SeatGeek**, and **SerpApi (Google Events)**.
- **Niche Discovery**: Specialized logic for finding local-heavy categories like **Tech Networking**, **Art Classes**, and **Community Meetups** that major ticket platforms ignore.
- **Performance Caching**: Supabase-backed `event_cache` system with 24-hour TTL to ensure lightning-fast responses while protecting API quotas.
- **Smart Fallbacks**: Automatically triggers deep-web searches (via SerpApi) only when standard sources return low-density results.

### 💳 Monetization Ready
Production-ready **Stripe** integration for:
- **24-Hour Passes** ($1.99)
- **DateSpark Plus** ($9.99/mo) with unlimited AI generations.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | **React 19 / Vite 7** | Modern, high-performance UI foundation |
| **Styling** | **Tailwind CSS v4** | Next-gen utility-first CSS with native performance |
| **AI Core** | **Gemini 2.5 Pro** | Advanced multimodal reasoning for itinerary generation |
| **AI Service** | **Python** | Dedicated microservice for AI orchestration and prompts |
| **Backend** | **Node.js / Express 5** | Scalable API Gateway and service orchestration |
| **Discovery** | **TM / SeatGeek / SerpApi** | Multi-source hybrid event intelligence engine |
| **Database** | **Supabase (Postgres)** | Real-time data synchronization and secure storage |
| **Auth** | **Supabase Auth** | Enterprise-grade JWT-based authentication |
| **Payments** | **Stripe** | Production-ready payment processing (Passes & Plus) |
| **Engagement** | **Resend** | Automated transactional email delivery |
| **Maps** | **Google Places API** | Real-time venue intelligence and geolocation |

---

## 🏗️ Microservices Architecture

- **Gateway Service (Node.js)**: Orchestrates requests between the frontend and internal services.
- **AI Microservice (Python)**: Decoupled logic for prompt engineering and Gemini 2.5 Pro interfacing.
- **Core Services**: Modularized handlers for Itineraries, Events, Payments, and Users.

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
