genai_client = genai.Client(api_key=API_KEY)
import os
from google import genai
from dotenv import load_dotenv

# Load .env file from current directory
load_dotenv()

API_KEY = os.environ.get("GEMINI_API_KEY")
MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.0-pro")

if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY not set in environment!")

genai_client = genai.Client(api_key=API_KEY)

try:
    response = genai_client.models.generate_content(
        model=MODEL,
        contents="hi",
        config={"temperature": 0.2}
    )
    print("Model response:", response.text.strip())
except Exception as e:
    print("Error communicating with Gemini:", e)
