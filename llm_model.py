from google import genai
import requests
from config import GEMINI_MODEL_LLM, GEMINI_MODEL_EMBEDDING
from dotenv import load_dotenv
import os

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def use_model(prompt, model=GEMINI_MODEL_LLM):
    if (model == "qwen"):
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "qwen2.5:7b",
                "prompt": prompt,
                "stream": False,
                "keep_alive": "30m"
            }
        )
        return response.json()
    elif (model == "gemini-2.5-flash"):
        response = client.interactions.create(
            model="gemini-2.5-flash",
            input=prompt
        )
        return response
    elif (model == "gemma4:e4b"):
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "gemma4:e4b",
                "prompt": prompt,
                "stream": False, 
                "keep_alive": "30m",
                "options": {"num_ctx": 8192, "temperature": 0}
            }
        )
        print(response.json())
        return response.json()
    
def use_embed(prompt, model_embed=GEMINI_MODEL_EMBEDDING):
    if (model_embed == "gemini-embedding-001"):
        response = client.models.embed_content(
            model=GEMINI_MODEL_EMBEDDING,
            contents=prompt
        )
        return [i.values for i in response.embeddings]
    elif (model_embed == "qwen3-embedding"):
        response = requests.post(
            "http://localhost:11434/api/embed",
            json={
                "model": "qwen3-embedding",
                "input": prompt,
                "keep_alive": "30m"
            }
        )
        return response.json()["embeddings"]
