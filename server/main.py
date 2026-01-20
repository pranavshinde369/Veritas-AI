import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# 1. Load Environment Variables (API Key)
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

# 2. Initialize the App
app = FastAPI(title="Veritas AI Server")

# 3. Enable CORS (Crucial: Allows Chrome Extension to talk to Python)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all extensions/origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Define the Data Model (What the Extension sends us)
class AnalyzeRequest(BaseModel):
    tool: str       # e.g., "News Audit"
    content: str    # The text or URL found on the page
    image_data: str = None # Base64 string if it's a screenshot

# 5. The Root Endpoint (Health Check)
@app.get("/")
def read_root():
    return {"status": "Veritas AI Server is Running", "model": "Gemini 2.0 Flash"}

# 6. The Analysis Endpoint (The Main Logic)
@app.post("/analyze")
async def analyze_content(request: AnalyzeRequest):
    print(f"Received request for tool: {request.tool}")
    
    # --- SIMULATION MODE (For Testing Connection First) ---
    # We will hook up real Gemini in the next step. 
    # First, let's verify the extension can actually reach this server.
    
    import time
    time.sleep(1) # Simulate thinking
    
    if not API_KEY:
        return {"result": "Error: API Key missing in .env"}

    return {
        "status": "success",
        "tool": request.tool,
        "verdict": "SAFE",
        "confidence": 98,
        "message": f"Server received your {request.tool} request successfully. Connection established."
    }

# 7. Run the Server
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)