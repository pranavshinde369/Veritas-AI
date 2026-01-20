import os
import uvicorn
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

app = FastAPI(title="Veritas AI Server (Formatted)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    tool: str
    content: str = ""
    image_data: str | None = None

@app.get("/")
def read_root():
    return {"status": "Veritas AI (Bullet Points Active)"}

@app.post("/analyze")
async def analyze_content(request: AnalyzeRequest):
    print(f"🧠 Processing {request.tool} request...")

    # 1. Define Prompt with STRICT FORMATTING
    system_instruction = "You are an expert AI Sentinel."
    
    if request.tool == "News Audit":
        system_instruction = "Analyze this image/text for fake news artifacts. Verdict: SAFE, SUSPICIOUS, or FAKE. Keep it short (max 2 sentences)."
    
    elif request.tool == "Legal Decoder":
        # --- STRICT BULLET POINT MODE ---
        system_instruction = """
        You are a Legal Assistant. 
        1. Summarize the text in ONE sentence.
        2. List exactly 3 distinct "Red Flags".
        3. Use this specific format:
           • Risk 1: [Short explanation]
           • Risk 2: [Short explanation]
           • Risk 3: [Short explanation]
        4. Keep the total response under 60 words.
        """
    
    elif request.tool == "Site Health":
        system_instruction = "Is this website context a scam? Verdict: SAFE or UNSAFE. Explanation in 1 sentence."
    
    elif request.tool == "Finfluencer Audit":
        system_instruction = "Does this financial advice promise unrealistic returns? Verdict: SAFE or SCAM. Explanation in 1 sentence."

    # 2. Call Gemini
    try:
        model_name = "gemini-2.0-flash" 

        if request.image_data and "base64," in request.image_data:
            clean_b64 = request.image_data.split("base64,")[1]
            image_bytes = base64.b64decode(clean_b64)
            
            response = client.models.generate_content(
                model=model_name,
                contents=[
                    types.Content(
                        role="user",
                        parts=[
                            types.Part.from_text(text=system_instruction),
                            types.Part.from_bytes(data=image_bytes, mime_type="image/png")
                        ]
                    )
                ]
            )
        else:
            response = client.models.generate_content(
                model=model_name,
                contents=f"{system_instruction}\n\nUser Content: {request.content}"
            )
            
        print("✅ Analysis Complete")
        return {"status": "success", "tool": request.tool, "message": response.text}

    except Exception as e:
        error_msg = str(e)
        print(f"❌ Error: {error_msg}")
        return {"status": "error", "message": f"System Error: {error_msg}"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)