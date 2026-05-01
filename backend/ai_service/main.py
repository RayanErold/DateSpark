import os
import json
import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from google import genai
from openai import OpenAI
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
        model='gemini-2.0-flash',
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
        final_prompt = f"""
        You are the 'Date Architect' for DateSpark. 
        User Request: "{request.prompt}"
        
        Plan a perfect date based on this request. If the location is missing, assume New York City but mention it.
        Return a structured JSON with:
        - title: Catchy name for the date
        - description: A romantic/fun summary
        - schedule: Array of 3 activities with 'time', 'activity', and 'reason'.
        """
    else:
        # Use structured builder data
        final_prompt = f"""
        You are the 'Date Architect' for DateSpark. 
        Plan a perfect date in {request.city or 'NYC'} with a {request.vibe or 'chill'} vibe.
        Budget: {request.budget or 'flexible'}. 
        Additional Preferences: {request.preferences or 'None'}.
        
        Return a structured JSON with:
        - title: Catchy name for the date
        - description: A romantic/fun summary
        - schedule: Array of 3 activities with 'time', 'activity', and 'reason'.
        """
    
    # Try Gemini First
    try:
        logger.info(f"Attempting generation with Gemini for {request.city or 'Copilot Prompt'}")
        content = await generate_with_gemini(final_prompt)
        return {"raw_itinerary": content, "provider": "gemini"}
    except Exception as e:
        logger.error(f"Gemini failed: {str(e)}")
        
        # Fallback to OpenAI
        if OPENAI_API_KEY:
            try:
                logger.info(f"Falling back to OpenAI for {request.city or 'Copilot Prompt'}")
                content = await generate_with_openai(final_prompt)
                return {"raw_itinerary": content, "provider": "openai"}
            except Exception as oe:
                logger.error(f"OpenAI fallback failed: {str(oe)}")
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
                model='gemini-2.0-flash',
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
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
