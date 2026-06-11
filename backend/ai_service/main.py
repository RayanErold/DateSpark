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

class ItineraryRequest(BaseModel):
    # Support both structured parameters and raw natural language prompts
    city: Optional[str] = None
    vibe: Optional[str] = None
    budget: Optional[str] = None
    preferences: Optional[str] = None
    prompt: Optional[str] = None # For raw copilot prompts
    lat: Optional[float] = None
    lng: Optional[float] = None
    numActivities: Optional[int] = 3
    radius: Optional[float] = None
    planDate: Optional[str] = None
    planTime: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    history: List[dict]

@app.get("/health")
def health_check():
    return {
        "status": "online", 
        "service": "ai-itinerary-generator",
        "providers": {
            "gemini": bool(GEMINI_API_KEY),
            "openai": bool(OPENAI_API_KEY)
        }
    }

async def generate_with_gemini(prompt: str):
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
            response = gemini_client.models.generate_content(
                model=model_name,
                contents=prompt
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
        # Use raw copilot prompt
        context = f"User Request: \"{request.prompt}\""
        if request.lat and request.lng:
            context += f" (Location coordinates: {request.lat}, {request.lng})"
        context += f"\nPlan details - Steps: {num_stops}, Radius: {radius_val}, Time: {time_str}, Date: {date_str}."
        city_context = f"If the location is missing, assume {request.city or 'New York City'} but mention it."
    else:
        # Use structured builder data
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
    You are the Elite Date Concierge for DateSpark, a premium hospitality agent specializing in curating unforgettable, highly cohesive romantic experiences and day trips.
    
    USER PROFILE & CONTEXT:
    {context}
    {city_context}
    
    CRITICAL PLANNING PRINCIPLES:
    1. GEOGRAPHIC COHESION: Ensure all steps have minimal transit friction. Consecutive stops should form a logical physical route (walking distance or a short ride) starting from the user's location or central node.
    2. TEMPORAL & EXPERIENCE ARC: Create a natural progression. A perfect date flows from a welcoming icebreaker or cozy conversation spot to a highlight meal, concluding with a memorable, intimate nightcap or scenic view.
    3. SEARCH QUERY HIGH-INTENT: Your 'search_query' MUST be a high-intent Google Maps search string. Do NOT use generic terms. Example: 'Best intimate speakeasy with craft cocktails in East Village NYC'.
    4. NO FAKE VENUES: Always use 'REAL PLACE TBD' as the venue. The semantic search engine will enrich this later.
    5. SEQUENTIAL EXACTNESS: Always return exactly {num_stops} sequential stops.
    
    OUTPUT FORMAT REQUIREMENTS:
    Return a structured JSON with:
    - title: An inspiring, romantic, or fun title for the date (max 5 words)
    - description: A premium, enticing summary of the date night narrative (max 20 words)
    - steps: Array of exactly {num_stops} activities. Each step MUST include:
        * 'time': E.g., '6:30 PM'
        * 'activity': A concise, capitalized category (e.g., 'Dinner', 'Cocktails', 'Stroll'). Max 3 words.
        * 'venue': 'REAL PLACE TBD'
        * 'search_query': A high-intent, short Google Maps search string (e.g., 'Chic rooftop lounge with skyline views, Williamsburg Brooklyn').
        * 'description': A rich, luxurious blurb (45-60 words) structured as follows:
           "A sensory description of the vibe and aesthetic. 
           • 💡 Concierge Tip: [Specific insider recommendation, e.g., signature cocktail, best table, hidden entrance].
           • 👔 Attire: [Suggested dress code, e.g., Smart Casual / Cocktail].
           • 📅 Booking: [Reservation urgency, e.g., Reserve 1 week ahead / Walk-ins only]."
    """
    
    # Try Gemini First
    try:
        content, model_used = await generate_with_gemini(final_prompt)
        return {"raw_itinerary": content, "provider": f"gemini ({model_used})"}
    except Exception as e:
        logger.error(f"Gemini stack failed: {str(e)}")
        # Fallback to OpenAI
        if OPENAI_API_KEY:
            try:
                content = await generate_with_openai(final_prompt)
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
            content, model_used = await generate_with_gemini(request.message)
            return {"reply": content, "provider": f"gemini ({model_used})"}
        elif openai_client:
            content = await generate_with_openai(request.message)
            return {"reply": content, "provider": "openai (gpt-4o-mini)"}
        else:
            raise HTTPException(status_code=500, detail="No AI providers available")
    except Exception as e:
        logger.error(f"Chat failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
