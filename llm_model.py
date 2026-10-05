import os
import requests
from dotenv import load_dotenv
from config import (
    GEMINI_MODEL_LLM,
    GEMINI_MODEL_EMBEDDING,
    FALLBACK_EMBEDDING_MODEL
)

load_dotenv()

# ==========================================
# OLLAMA BASE URL
# ==========================================
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")

# Initialize Gemini Client if API key is present
gemini_client = None
gemini_key = os.getenv("GEMINI_API_KEY")
if gemini_key:
    try:
        from google import genai
        gemini_client = genai.Client(api_key=gemini_key)
    except Exception as e:
        print(f"Warning: could not initialize Google GenAI client: {e}")


# ==========================================
# LLM FUNCTION
# ==========================================

def use_model(prompt, model=GEMINI_MODEL_LLM, temperature=0):
    """
    Executes prompt against Ollama (qwen2.5:3b) or Google Gemini (optional).
    """
    norm_model = str(model).strip().lower()

    # --------------------------------------
    # Ollama Local (Qwen 2.5 3B or specified Ollama tag)
    # --------------------------------------
    if norm_model in ["qwen", "qwen2.5:3b", "qwen2.5", "qwen:3b"] or not norm_model.startswith("gemini"):
        ollama_model_tag = "qwen2.5:3b" if norm_model in ["qwen", "qwen2.5:3b", "qwen2.5", "qwen:3b"] else model
        try:
            response = requests.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": ollama_model_tag,
                    "prompt": prompt,
                    "stream": False,
                    "keep_alive": "10m",
                    "options": {
                        "temperature": temperature
                    }
                },
                timeout=300
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            # If Ollama fails and Gemini is available, offer fallback
            if gemini_client and norm_model.startswith("gemini"):
                pass
            else:
                raise RuntimeError(f"Ollama request error for model '{ollama_model_tag}': {e}")

    # --------------------------------------
    # Google Gemini Support (Optional Cloud Model)
    # --------------------------------------
    if norm_model.startswith("gemini"):
        if not gemini_client:
            raise ValueError("GEMINI_API_KEY is not configured or google-genai client failed to initialize.")
        
        try:
            # Map model name
            actual_model = model
            response = gemini_client.models.generate_content(
                model=actual_model,
                contents=prompt
            )
            return response
        except Exception as e:
            raise RuntimeError(f"Gemini API error for model '{model}': {e}")

    raise ValueError(f"Unsupported LLM model: {model}")


# ==========================================
# EMBEDDING FUNCTION
# ==========================================

def use_embed(texts, model_embed=GEMINI_MODEL_EMBEDDING):
    """
    Generates text embeddings via Ollama (qwen3-embedding, nomic-embed-text)
    or Google Gemini embeddings (optional).
    """
    if isinstance(texts, str):
        texts = [texts]

    norm_embed = str(model_embed).strip().lower()

    # --------------------------------------
    # Ollama Embedding Models
    # --------------------------------------
    if not norm_embed.startswith("gemini"):
        candidate_models = []
        if norm_embed in ["qwen3-embedding", "qwen3"]:
            candidate_models = ["qwen3-embedding", FALLBACK_EMBEDDING_MODEL]
        else:
            candidate_models = [model_embed, FALLBACK_EMBEDDING_MODEL]

        last_error = None
        for cand in candidate_models:
            try:
                response = requests.post(
                    f"{OLLAMA_URL}/api/embed",
                    json={
                        "model": cand,
                        "input": texts,
                        "keep_alive": "10m"
                    },
                    timeout=300
                )
                if response.status_code == 200:
                    result = response.json()
                    return result["embeddings"]
                else:
                    last_error = f"Status {response.status_code}: {response.text}"
            except Exception as e:
                last_error = str(e)
                continue

        raise RuntimeError(f"Failed to generate embeddings using Ollama ({candidate_models}). Error: {last_error}")

    # --------------------------------------
    # Google Gemini Embeddings (Optional)
    # --------------------------------------
    if norm_embed.startswith("gemini"):
        if not gemini_client:
            raise ValueError("GEMINI_API_KEY is not configured for Gemini embeddings.")
        try:
            response = gemini_client.models.embed_content(
                model=model_embed,
                contents=texts
            )
            # Normalize to list of embedding vectors
            embeddings = [emb.values for emb in response.embeddings]
            return embeddings
        except Exception as e:
            raise RuntimeError(f"Gemini embedding error for model '{model_embed}': {e}")

    raise ValueError(f"Unsupported embedding model: {model_embed}")