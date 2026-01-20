import os
import uvicorn
import whois  # requires: pip install python-whois
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from google.genai import types
import base64

# 1. Setup
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    print("CRITICAL ERROR: GEMINI_API_KEY is missing in .env file")

client = genai.Client(api_key=API_KEY)

app = FastAPI(title="Veritas AI Pro Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Updated Request Model to accept URL and Text content
class AnalyzeRequest(BaseModel):
    tool: str
    content: str = ""        # Text extracted from the page
    url: str = ""            # Page URL (for domain checks)
    image_data: str | None = None

@app.get("/")
def read_root():
    return {"status": "Veritas AI (Hybrid Engine) Active"}

@app.post("/analyze")
async def analyze_content(request: AnalyzeRequest):
    print(f"🧠 Processing {request.tool} request...")
    
    # --- INTELLIGENCE GATHERING: DOMAIN AGE ---
    # Only runs for 'Site Health' to check if a site is suspiciously new
    domain_info = ""
    if request.tool == "Site Health" and request.url:
        try:
            domain = whois.whois(request.url)
            creation_date = domain.creation_date
            
            # Handle list of dates (some registrars return lists)
            if isinstance(creation_date, list):
                creation_date = creation_date[0]
            
            if creation_date:
                age = (datetime.now() - creation_date).days
                domain_info = f"[DOMAIN INTEL] Creation Date: {creation_date}. Age: {age} days old. Registrar: {domain.registrar}."
            else:
                domain_info = "[DOMAIN INTEL] Creation date hidden."
        except Exception as e:
            domain_info = f"[DOMAIN INTEL] Lookup failed: {str(e)}"

    # 1. Define Prompt Logic
    system_instruction = "You are an expert AI Sentinel."
    
    if request.tool == "News Audit":
        # Uses mostly Text extraction for accuracy
        system_instruction = "You are a Fact Checker. Analyze this article text. 1. Check for sensationalism. 2. Verify if the facts sound plausible. Verdict: 'Reliable', 'Biased', or 'Fake'. Keep it short."
    
    elif request.tool == "Legal Decoder":
        # Uses Full Page Text (Hybrid)
        system_instruction = """
        You are a Legal Assistant. 
        1. Summarize the text in ONE sentence.
        2. List exactly 3 distinct "Red Flags" (hidden fees, data selling, arbitration).
        3. Use this specific format:
           • Risk 1: [Short explanation]
           • Risk 2: [Short explanation]
           • Risk 3: [Short explanation]
        4. Keep the total response under 60 words.
        """
    
    elif request.tool == "Site Health":
        # Uses Screenshot + URL Data
        system_instruction = f"Analyze this website context. {domain_info} Visual Context: See attached screenshot. Verdict: SAFE or UNSAFE. Explanation: Check if the visual brand matches the domain age (e.g., a big bank shouldn't be 1 week old)."

    elif request.tool == "Finfluencer Audit":
        # Uses Screenshot (for charts) + Text
        system_instruction = "Analyze the financial advice in this image/text. Does it promise unrealistic returns? Verdict: SAFE or SCAM. Explanation in 1 sentence."

    elif request.tool == "Sub Tracker":
        # Uses Text Extraction
        system_instruction = "Scan this text for subscription details. Extract: 'Service Name', 'Cost', and 'Renewal Date'. Output as a clean sentence like: 'Found [Service] for [Price], renewing on [Date].'"

    elif request.tool == "AI Gen or Real":
        # Uses Visual Artifacts
        system_instruction = "Analyze this content. Look for AI artifacts (extra fingers, weird text, smooth skin). Verdict: 'Human Made' or 'AI Generated'. Give 1 reason."

    # 2. Call Gemini
    try:
        model_name = "gemini-2.0-flash" 

        # A. HYBRID MODE (Image + Text)
        if request.image_data and "base64," in request.image_data:
            clean_b64 = request.image_data.split("base64,")[1]
            image_bytes = base64.b64decode(clean_b64)
            
            response = client.models.generate_content(
                model=model_name,
                contents=[
                    types.Content(
                        role="user",
                        parts=[
                            types.Part.from_text(text=system_instruction + f"\n\nContext Text: {request.content}"),
                            types.Part.from_bytes(data=image_bytes, mime_type="image/png")
                        ]
                    )
                ]
            )
        # B. TEXT ONLY MODE (Faster)
        else:
            response = client.models.generate_content(
                model=model_name,
                contents=f"{system_instruction}\n\nPAGE TEXT:\n{request.content}"
            )
            
        print("✅ Analysis Complete")
        return {"status": "success", "tool": request.tool, "message": response.text}

    except Exception as e:
        print(f"❌ Error: {e}")
        return {"status": "error", "message": f"System Error: {str(e)}"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)