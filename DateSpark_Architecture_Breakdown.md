# 💎 DateSpark: Complete Architectural Breakdown

This document provides a comprehensive walkthrough of the **DateSpark** codebase, explaining the purpose of every folder and file, the rationale behind the tech stack, and the core logic of the application.

---

## 🚀 The Tech Stack: Why These Choices?

### 1. React 19 & Vite 7 (Frontend)
- **Why?** React 19 provides the most modern, hook-based UI management. Vite 7 is used as the build tool because it is significantly faster than legacy tools like Webpack, providing near-instant hot-reloading during development.

### 2. Node.js & Express 5 (API Gateway)
- **Why?** Node.js is perfect for I/O intensive tasks like proxying requests to multiple APIs (Ticketmaster, SeatGeek, Stripe). Express 5 (the latest) handles our routing logic with minimal overhead.

### 3. Python & FastAPI (AI Microservice)
- **Why AI in Python?** While Node.js can call AI APIs, Python is the native language of AI. Libraries for Google Gemini and OpenAI are most robust in Python. By putting AI in its own microservice, we can scale it independently of the web server.

### 4. Supabase (Backend-as-a-Service)
- **Why?** Instead of setting up a manual Postgres DB, Auth server, and S3 bucket, Supabase provides all three in a unified platform. This allows us to focus on the *product* rather than infrastructure.

### 5. Why JavaScript and not TypeScript?
- **Velocity**: DateSpark was built as a "Million Dollar Idea" MVP. In this stage, data structures (especially AI-generated ones) change rapidly. JS allows for rapid iteration without the "overhead" of strictly defining interfaces for data that is still shifting.
- **Flexibility**: AI responses can be unpredictable. Working with plain objects in JS is often faster than fighting with complex nested interfaces in TS during the MVP phase.
- **Simplicity**: For learning, JS allows you to focus on the *execution flow* rather than the *syntax* of types.

---

## 📁 Frontend Breakdown (`/frontend`)

### `main.jsx` & `App.jsx`
- **Purpose**: The entry point. `main.jsx` mounts the React app. `App.jsx` handles the global routing (using React Router), defining which pages show up at which URLs (e.g., `/dashboard`, `/pricing`).

### `index.css`
- **Purpose**: The global design system. Contains Tailwind CSS v4 configurations, custom glassmorphism utilities, and the "Ambient Glow" animations that give the app its premium look.

### `/pages` (The Views)
- **`LandingPage.jsx`**: The high-conversion homepage.
- **`PricingPage.jsx`**: Displays the Stripe subscription tiers.
- **`/auth`**: Contains login and signup logic using Supabase Auth.
- **`/dashboard`**: The user's home base where they see their generated plans.
- **`/spark`**: The "Date Builder" flow where the AI generation happens.

### `/components` (The Building Blocks)
- **`/landing`**: Components like `Hero.jsx`, `Features.jsx`, and `BlogSection.jsx`. These are optimized for SEO and visual "Wow" factor.
- **`/spark-ui`**: Specialized components for the date generator, like the "Vibe Selector" or the "Budget Slider."
- **`/ui`**: Generic, reusable components like `Button.jsx`, `Input.jsx`, and `SkeletonLoader.jsx`.
- **`/modals`**: Popups for feedback, plan saving, or payment confirmations.

### `/lib` (The Infrastructure)
- **`supabase.js`**: The client-side connection to our database.
- **`googleMaps.js`**: Logic for interacting with the Google Places Autocomplete and Map rendering.
- **`hooks/`**: Custom React hooks like `useABTest.js` (for testing different designs) and `useUsage.js` (to track how many plans a user has left).

---

## 📁 Backend Breakdown (`/backend`)

### `index.js` (The API Gateway)
- **Purpose**: This is the "Front Door" of your server. It listens for requests from the frontend, checks if the user is logged in, and then either talks to Supabase or routes the request to one of the **Services**.

### `/services` (The Brains)
- **`itineraryService.js`**: The most complex file. It handles saving plans, boosting them, searching, and managing venue ratings.
- **`generationService.js`**: Specifically handles the communication between the Gateway and the **AI Microservice**. It "pre-processes" your request before asking the AI to build a date.
- **`eventService.js`**: The "Hybrid Discovery Engine." It fetches real-time data from Ticketmaster and SeatGeek and merges them into a single list.
- **`paymentService.js`**: The Stripe integration. It creates "Checkout Sessions" so users can buy the 24-Hour Pass.
- **`emailService.js`**: Uses **Resend** to send welcome emails and feedback notifications.

### `/ai_service` (The AI Specialist)
- **`main.py`**: A FastAPI server that runs on a different port (8001).
- **Purpose**: It holds the "Date Architect" prompt. It's responsible for taking your "vibe" and "city" and turning it into a structured JSON itinerary.
- **Failover Logic**: If Google Gemini is down, this script automatically switches to OpenAI's GPT-4o-mini so the app never stops working.

---

## 🔄 The "Step-by-Step" Execution Flow

When a user clicks **"Generate My Date"**:
1. **Frontend**: The `GenerateButton` sends a POST request to `/api/generate-date`.
2. **Gateway**: `index.js` receives the request and passes it to `generationService.js`.
3. **Service Logic**: The service checks if the user has enough "credits" via `userService.js`.
4. **AI Call**: `generationService` sends the prompt to the Python `ai_service` on port 8001.
5. **AI Reasoning**: The Python script calls Gemini 2.5 Pro, gets the JSON itinerary, and returns it to the Gateway.
6. **Enrichment**: The Gateway calls `itineraryService` to save the new plan to Supabase.
7. **Response**: The frontend receives the saved plan and navigates to the "Itinerary View."

---

## 📝 Glossary of Key Root Files
- `.env`: Where all your secret API keys (Stripe, Gemini, Supabase) are stored.
- `package.json`: The "Manifest" listing every library the project depends on.
- `render.yaml`: Configuration for deploying the whole system to the cloud (Render.com).
- `setup_ai.bat`: A shortcut script to install and start the Python microservice.
