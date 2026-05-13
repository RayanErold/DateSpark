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
    
    response = gemini_client.models.generate_content(
        model='gemini-2.5-pro',
        contents=prompt
    )
    return response.text

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
    
    if request.prompt:
        # Use raw copilot prompt
        context = f"User Request: \"{request.prompt}\""
        city_context = "If the location is missing, assume New York City but mention it."
    else:
        # Use structured builder data
        context = f"""
        City: {request.city or 'NYC'}
        Vibe: {request.vibe or 'chill'}
        Budget: {request.budget or 'flexible'}
        Preferences: {request.preferences or 'None'}
        """
        city_context = ""

    final_prompt = f"""
    You are the 'Date Architect' for DateSpark. 
    {context}
    {city_context}
    
    CRITICAL INSTRUCTIONS:
    1. DO NOT make up venue names (e.g., don't say 'The Romantic Bistro'). Use 'REAL PLACE TBD' as the venue.
    2. Your 'search_query' MUST be a high-intent string that Google Maps can use to find a REAL, highly-rated business.
       Example: 'Best romantic rooftop bar with Empire State views in {request.city or 'NYC'}'
    3. Ensure the 'activity' is descriptive but concise.
    
    Return a structured JSON with:
    - title: Catchy name for the date (max 5 words)
    - description: A romantic/fun summary (max 20 words)
    - steps: Array of 3 activities. Each step MUST include:
        * 'time': e.g., '7:00 PM'
        * 'activity': A CONCISE category (e.g., 'Dinner', 'Cocktails', 'Stroll'). Max 3 words. DO NOT put the description here.
        * 'venue': 'REAL PLACE TBD'
        * 'description': A short, enticing blurb.
        * 'search_query': A high-intent, short Google Maps search string (e.g. 'Best speakeasy in East Village, NYC').
    """
    
    # Try Gemini First
    try:
        response = await generate_with_gemini(final_prompt)
        return {"raw_itinerary": response, "provider": "gemini"}
    except Exception as e:
        
        # Fallback to OpenAI
        if OPENAI_API_KEY:
            try:
                content = await generate_with_openai(final_prompt)
                return {"raw_itinerary": content, "provider": "openai"}
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
            response = gemini_client.models.generate_content(
                model='gemini-2.5-pro',
                contents=request.message
            )
            return {"reply": response.text, "provider": "gemini"}
        elif openai_client:
            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": request.message}]
            )
            return {"reply": response.choices[0].message.content, "provider": "openai"}
        else:
            raise HTTPException(status_code=500, detail="No AI providers available")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
