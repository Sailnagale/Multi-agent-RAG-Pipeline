from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

response = client.interactions.create(
    model="gemini-3.8-flash",
    input="Say hello in one sentence."
)

print("RESPONSE:")
print(response.output_text)