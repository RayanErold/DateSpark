import os
import json
import logging
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from typing import List, Optional
# pyrefly: ignore [missing-import]
from google import genai
from google.genai import types
# pyrefly: ignore [missing-import]
from openai import OpenAI
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DateSpark-AI")

app = FastAPI(title="DateSpark AI Service")

# Configure AI Providers
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL") or 'http://localhost:8001'

gemini_client = None
if GEMINI_API_KEY:
    gemini_client = genai.Client(api_key=GEMINI_API_KEY)
else:
    logger.warning("GEMINI_API_KEY not found in environment")

openai_client = None
if OPENAI_API_KEY:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
else:
    logger.warning("OPENAI_API_KEY not found in environment")

# Context Caching Global Variables
itinerary_cache = None

SYSTEM_CONTEXT_TEMPLATE = """
You are the Elite Date Concierge for DateSpark, a premium hospitality agent specializing in curating unforgettable, highly cohesive romantic experiences and day trips.

CRITICAL PLANNING PRINCIPLES:
1. GEOGRAPHIC COHESION: Ensure all steps have minimal transit friction. Consecutive stops should form a logical physical route (walking distance or a short ride) starting from the user's location or central node.
2. TEMPORAL & EXPERIENCE ARC: Create a natural progression. A perfect date flows from a welcoming icebreaker or cozy conversation spot to a highlight meal, concluding with a memorable, intimate nightcap or scenic view.
3. SEARCH QUERY HIGH-INTENT: Your 'search_query' MUST be a high-intent Google Maps search string. Do NOT use generic terms. Example: 'Best intimate speakeasy with craft cocktails in East Village NYC'.
4. NO FAKE VENUES: Always use 'REAL PLACE TBD' as the venue. The semantic search engine will enrich this later.
5. SEQUENTIAL EXACTNESS: Always return exactly the requested number of sequential stops.

OUTPUT FORMAT REQUIREMENTS:
Return a structured JSON with:
- title: An inspiring, romantic, or fun title for the date (max 5 words)
- description: A premium, enticing summary of the date night narrative (max 20 words)
- steps: Array of activities. Each step MUST include:
    * 'time': E.g., '6:30 PM'
    * 'activity': A concise, capitalized category (e.g., 'Dinner', 'Cocktails', 'Stroll'). Max 3 words.
    * 'venue': 'REAL PLACE TBD'
    * 'search_query': A high-intent, short Google Maps search string.
    * 'description': An extremely short, single-sentence blurb (max 15-20 words total) structured exactly as:
       "One short sensory sentence (max 8-10 words). • 💡 Tip: [Max 5 words]. • 👔 Attire: [Max 2 words]. • 📅 Booking: [Max 2 words]."

EXAMPLES OF PRECISE OUTPUT:
Example 1: Sunset & Speakeasy in New York City (2 stops)
{
  "title": "Williamsburg Skyline & Speakeasy Vibes",
  "description": "A sophisticated evening blending gorgeous Manhattan skyline views with intimate, candle-lit craft cocktails.",
  "steps": [
    {
      "time": "7:00 PM",
      "activity": "Cocktails & Views",
      "venue": "REAL PLACE TBD",
      "search_query": "Chic hotel rooftop bar with skyline views Williamsburg Brooklyn",
      "description": "Watch Manhattan glow as twilight sets over the East River. • 💡 Tip: Arrive before sunset. • 👔 Attire: Smart casual. • 📅 Booking: Highly recommended."
    },
    {
      "time": "8:30 PM",
      "activity": "Cozy Dinner",
      "venue": "REAL PLACE TBD",
      "search_query": "Intimate candlelit Italian restaurant Williamsburg Brooklyn",
      "description": "Share handmade pasta under warm, vintage amber lights. • 💡 Tip: Try truffle gnocchi. • 👔 Attire: Elegant. • 📅 Booking: Required."
    }
  ]
}

Example 2: Active Scenic Day in Seattle (3 stops)
{
  "title": "Seattle Heights & Historic Bites",
  "description": "An active, scenic date starting at a historic market, climbing to panoramic heights, and ending with cozy drinks.",
  "steps": [
    {
      "time": "2:00 PM",
      "activity": "Market Stroll",
      "venue": "REAL PLACE TBD",
      "search_query": "Pike Place Market walking tour Seattle WA",
      "description": "Wander past fresh flower stalls and sample local fruits. • 💡 Tip: Try ginger beer. • 👔 Attire: Casual. • 📅 Booking: Optional."
    },
    {
      "time": "4:00 PM",
      "activity": "Skyline Views",
      "venue": "REAL PLACE TBD",
      "search_query": "Kerry Park scenic viewpoint Queen Anne Seattle WA",
      "description": "Admire the space needle framed by majestic Mount Rainier. • 💡 Tip: Bring a camera. • 👔 Attire: Layers. • 📅 Booking: Open access."
    },
    {
      "time": "6:00 PM",
      "activity": "Northwest Dinner",
      "venue": "REAL PLACE TBD",
      "search_query": "Cozy Pacific Northwest restaurant Queen Anne Seattle",
      "description": "Savor wood-fired salmon beside a crackling stone fireplace. • 💡 Tip: Ask for hearth seating. • 👔 Attire: Casual chic. • 📅 Booking: Recommended."
    }
  ]
}

Example 3: Art & Intimate Dining in Chicago (3 stops)
{
  "title": "Artistic River North Escape",
  "description": "An inspiring, culture-rich date through modern art galleries, artisan coffee, and romantic French cuisine.",
  "steps": [
    {
      "time": "3:00 PM",
      "activity": "Museum Visit",
      "venue": "REAL PLACE TBD",
      "search_query": "Modern art museum gallery tour River North Chicago IL",
      "description": "Admire thought-provoking modern masterpieces in high-ceiling galleries. • 💡 Tip: See local showcase. • 👔 Attire: Casual. • 📅 Booking: Recommended."
    },
    {
      "time": "5:30 PM",
      "activity": "Coffee & Pastries",
      "venue": "REAL PLACE TBD",
      "search_query": "Chic artisanal espresso cafe River North Chicago IL",
      "description": "Sip smooth lattes in a plant-filled glass atrium. • 💡 Tip: Try lavender croissant. • 👔 Attire: Casual. • 📅 Booking: Walk-in."
    },
    {
      "time": "7:00 PM",
      "activity": "French Bistro",
      "venue": "REAL PLACE TBD",
      "search_query": "Romantic French bistro with patio River North Chicago",
      "description": "Dine on classic steak frites under twinkling garden lights. • 💡 Tip: Save room for soufflé. • 👔 Attire: Smart casual. • 📅 Booking: Required."
    }
  ]
}

Example 4: Coastal Romance in San Francisco (3 stops)
{
  "title": "Bay Breeze & Secret Bars",
  "description": "A classic San Francisco coastal journey from Golden Gate views to waterfront dining and hidden speakeasies.",
  "steps": [
    {
      "time": "4:30 PM",
      "activity": "Scenic Walk",
      "venue": "REAL PLACE TBD",
      "search_query": "Crissy Field beach trail Golden Gate Bridge San Francisco CA",
      "description": "Feel the fresh ocean breeze beneath the iconic red arches. • 💡 Tip: Great for photos. • 👔 Attire: Warm layers. • 📅 Booking: Open access."
    },
    {
      "time": "6:30 PM",
      "activity": "Seafood Feast",
      "venue": "REAL PLACE TBD",
      "search_query": "High-end seafood restaurant overlooking bay San Francisco",
      "description": "Enjoy fresh Dungeness crab with floor-to-ceiling harbor views. • 💡 Tip: Get window seat. • 👔 Attire: Dressy. • 📅 Booking: Required."
    },
    {
      "time": "8:30 PM",
      "activity": "Speakeasy Drinks",
      "venue": "REAL PLACE TBD",
      "search_query": "Intimate vintage cocktail bar Marina District San Francisco",
      "description": "Unwind with bespoke cocktails behind a hidden bookshelf door. • 💡 Tip: Order custom drinks. • 👔 Attire: Sharp. • 📅 Booking: Optional."
    }
  ]
}

Example 5: Austin Music & Tacos (3 stops)
{
  "title": "South Congress Tunes & Tacos",
  "description": "An authentic, upbeat Austin date blending patio dining, vintage vinyl discovery, and intimate live jazz.",
  "steps": [
    {
      "time": "6:00 PM",
      "activity": "Casual Dining",
      "venue": "REAL PLACE TBD",
      "search_query": "Acoustic live music taco patio South Congress Austin TX",
      "description": "Munch on spicy brisket tacos under vibrant string lights. • 💡 Tip: Try local salsa. • 👔 Attire: Casual. • 📅 Booking: Walk-in."
    },
    {
      "time": "7:30 PM",
      "activity": "Vintage Shopping",
      "venue": "REAL PLACE TBD",
      "search_query": "Retro record shop and bookstore South Congress Austin",
      "description": "Flip through classic vinyl records and share favorite songs. • 💡 Tip: Check indie releases. • 👔 Attire: Casual. • 📅 Booking: Walk-in."
    },
    {
      "time": "9:00 PM",
      "activity": "Jazz Cocktails",
      "venue": "REAL PLACE TBD",
      "search_query": "Speakeasy jazz lounge with craft drinks Austin TX",
      "description": "Vibe to live saxophone melodies in a dark plush parlor. • 💡 Tip: Try bourbon sour. • 👔 Attire: Dressy. • 📅 Booking: Recommended."
    }
  ]
}
"""

def init_context_cache():
    global itinerary_cache, gemini_client
    if not gemini_client:
        logger.warning("Gemini Client not available. Cannot initialize context cache.")
        return
    try:
        logger.info("Initializing Gemini Context Caching for DateSpark Concierge...")
        itinerary_cache = gemini_client.caches.create(
            model="gemini-2.5-flash",
            config=types.CreateCachedContentConfig(
                display_name="datespark_concierge_cache",
                contents=[SYSTEM_CONTEXT_TEMPLATE],
                ttl="3600s" # 1 hour TTL
            )
        )
        logger.info(f"Successfully initialized Gemini Context Cache: {itinerary_cache.name}")
    except Exception as e:
        logger.error(f"Failed to initialize Context Cache (falling back to dynamic prompts): {str(e)}")
        itinerary_cache = None

@app.on_event("startup")
async def startup_event():
    init_context_cache()

class ItineraryRequest(BaseModel):
    city: Optional[str] = None
    vibe: Optional[str] = None
    budget: Optional[str] = None
    preferences: Optional[str] = None
    prompt: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    numActivities: Optional[int] = 3
    radius: Optional[float] = None
    planDate: Optional[str] = None
    planTime: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    history: List[dict]

class EmbeddingRequest(BaseModel):
    text: str
    model: Optional[str] = "gemini-embedding-2"
    dimensions: Optional[int] = 768

class BulkEmbeddingRequest(BaseModel):
    texts: List[str]
    model: Optional[str] = "gemini-embedding-2"
    dimensions: Optional[int] = 768

@app.get("/health")
def health_check():
    return {
        "status": "online", 
        "service": "ai-itinerary-generator",
        "providers": {
            "gemini": bool(GEMINI_API_KEY),
            "openai": bool(OPENAI_API_KEY)
        },
        "caching": {
            "initialized": bool(itinerary_cache),
            "cache_name": itinerary_cache.name if itinerary_cache else None
        }
    }

async def generate_with_gemini(prompt: str, use_cache: bool = False):
    if not gemini_client:
        raise Exception("Gemini provider not configured")
    
    models_to_try = [
        "gemini-2.5-pro",
        "gemini-2.5-flash-lite",
        "gemini-2.5-flash",
        "gemini-flash-latest"
    ]
    
    last_error = None
    for model_name in models_to_try:
        try:
            logger.info(f"Attempting generation with {model_name}...")
            if use_cache and model_name == "gemini-2.5-flash" and itinerary_cache:
                logger.info(f"Context cache hit for {model_name} using: {itinerary_cache.name}")
                response = gemini_client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        cached_content=itinerary_cache.name
                    )
                )
            else:
                contents_payload = f"{SYSTEM_CONTEXT_TEMPLATE}\n\n{prompt}" if use_cache else prompt
                response = gemini_client.models.generate_content(
                    model=model_name,
                    contents=contents_payload
                )
                
            logger.info(f"Success with {model_name}")
            return response.text, model_name
        except Exception as e:
            last_error = e
            logger.warning(f"Model {model_name} failed: {str(e)}")
            continue
            
    raise Exception(f"All Gemini models failed. Last error: {str(last_error)}")

async def generate_with_openai(prompt: str):
    if not openai_client:
        raise Exception("OpenAI provider not configured")
    
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are the 'Date Architect' for DateSpark. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ],
        response_format={ "type": "json_object" }
    )
    return response.choices[0].message.content

@app.post("/generate-itinerary")
async def generate_itinerary(request: ItineraryRequest):
    """
    Generate date itinerary with Gemini as primary and OpenAI as fallback.
    Supports both structured builder data and raw natural language copilot prompts.
    """
    num_stops = request.numActivities or 3
    radius_val = f"{(request.radius / 1609.34):.1f} miles" if request.radius else "walking distance/standard"
    time_str = request.planTime or "Evening"
    date_str = request.planDate or "Any date"

    if request.prompt:
        context = f"User Request: \"{request.prompt}\""
        if request.lat and request.lng:
            context += f" (Location coordinates: {request.lat}, {request.lng})"
        context += f"\nPlan details - Steps: {num_stops}, Radius: {radius_val}, Time: {time_str}, Date: {date_str}."
        city_context = f"If the location is missing, assume {request.city or 'New York City'} but mention it."
    else:
        context = f"""
        City: {request.city or 'NYC'}
        Vibe: {request.vibe or 'chill'}
        Budget: {request.budget or 'flexible'}
        Preferences: {request.preferences or 'None'}
        Location: {request.lat}, {request.lng} if available.
        Number of steps: {num_stops}
        Preferred Radius: {radius_val}
        Plan Time: {time_str}
        Plan Date: {date_str}
        """
        city_context = ""

    final_prompt = f"""
    USER PROFILE & CONTEXT:
    {context}
    {city_context}
    
    TASK:
    Please generate exactly {num_stops} sequential activities/stops for this user according to the guidelines.
    """
    
    # Try Gemini First (with context caching enabled)
    try:
        content, model_used = await generate_with_gemini(final_prompt, use_cache=True)
        return {"raw_itinerary": content, "provider": f"gemini ({model_used})"}
    except Exception as e:
        logger.error(f"Gemini stack failed: {str(e)}")
        # Fallback to OpenAI (needs full prompt with instructions)
        if OPENAI_API_KEY:
            try:
                full_openai_prompt = f"{SYSTEM_CONTEXT_TEMPLATE}\n\nUSER PROFILE & CONTEXT:\n{context}\n{city_context}\n\nTASK:\nPlease generate exactly {num_stops} sequential activities/stops for this user."
                content = await generate_with_openai(full_openai_prompt)
                return {"raw_itinerary": content, "provider": "openai (gpt-4o-mini)"}
            except Exception as oe:
                raise HTTPException(status_code=500, detail="All AI providers failed")
        else:
            raise HTTPException(status_code=500, detail=f"Gemini failed and no OpenAI fallback available: {str(e)}")

@app.post("/chat")
async def chat_with_architect(request: ChatRequest):
    """
    Real-time AI Chat logic with fallback.
    """
    try:
        if gemini_client:
            content, model_used = await generate_with_gemini(request.message, use_cache=False)
            return {"reply": content, "provider": f"gemini ({model_used})"}
        elif openai_client:
            content = await generate_with_openai(request.message)
            return {"reply": content, "provider": "openai (gpt-4o-mini)"}
        else:
            raise HTTPException(status_code=500, detail="No AI providers available")
    except Exception as e:
        logger.error(f"Chat failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/embed")
async def get_embedding(request: EmbeddingRequest):
    """
    Generate vector embeddings for the provided text using Gemini.
    """
    if not gemini_client:
        raise HTTPException(status_code=500, detail="Gemini provider not configured")
    try:
        config_args = {}
        if request.dimensions and request.model == "gemini-embedding-2":
            config_args["output_dimensionality"] = request.dimensions
            
        response = gemini_client.models.embed_content(
            model=request.model,
            contents=request.text,
            config=types.EmbedContentConfig(**config_args) if config_args else None
        )
        if response.embeddings and len(response.embeddings) > 0:
            return {"embedding": response.embeddings[0].values}
        else:
            raise HTTPException(status_code=500, detail="No embedding values returned from Gemini API")
    except Exception as e:
        logger.error(f"Embedding generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/embed/bulk")
async def get_embeddings_bulk(request: BulkEmbeddingRequest):
    """
    Generate bulk vector embeddings for the list of texts.
    """
    if not gemini_client:
        raise HTTPException(status_code=500, detail="Gemini provider not configured")
    try:
        config_args = {}
        if request.dimensions and request.model == "gemini-embedding-2":
            config_args["output_dimensionality"] = request.dimensions
            
        response = gemini_client.models.embed_content(
            model=request.model,
            contents=request.texts,
            config=types.EmbedContentConfig(**config_args) if config_args else None
        )
        embeddings = [emb.values for emb in response.embeddings]
        return {"embeddings": embeddings}
    except Exception as e:
        logger.error(f"Bulk embedding generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
