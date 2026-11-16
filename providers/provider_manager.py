import os
from typing import Any

from runtime_config import get as cfg_get

# -----------------------------------------------------------------
# Helper to pick the active provider name
# -----------------------------------------------------------------
def active_llm_provider() -> str:
    return cfg_get("LLM_PRIMARY_PROVIDER")  # e.g. "ollama" or "gemini"

def active_embed_provider() -> str:
    return cfg_get("EMBED_PRIMARY_PROVIDER")

# -----------------------------------------------------------------
# Provider base class (simplified for this project)
# -----------------------------------------------------------------
class BaseProvider:
    def generate(self, prompt: str, **kwargs: Any) -> Any:
        raise NotImplementedError

    def embed(self, texts: Any, **kwargs: Any) -> Any:
        raise NotImplementedError

# -----------------------------------------------------------------
# Ollama provider implementation
# -----------------------------------------------------------------
class OllamaProvider(BaseProvider):
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_URL", "http://localhost:11434")

    def generate(self, prompt: str, model: str = "qwen2.5:3b", temperature: float = 0.0, **_: Any) -> Any:
        import requests
        response = requests.post(
            f"{self.base_url}/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": temperature},
            },
            timeout=300,
        )
        response.raise_for_status()
        return response.json()

    def embed(self, texts, model: str = "all-minilm", **_: Any):
        import requests
        response = requests.post(
            f"{self.base_url}/api/embed",
            json={"model": model, "input": texts},
            timeout=300,
        )
        response.raise_for_status()
        return response.json()["embeddings"]

# -----------------------------------------------------------------
# Gemini provider implementation (optional, requires google-genai)
# -----------------------------------------------------------------
class GeminiProvider(BaseProvider):
    def __init__(self):
        from google import genai
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set")
        self.client = genai.Client(api_key=api_key)

    def generate(self, prompt: str, model: str = os.getenv("GEMINI_MODEL_LLM", "gemini-1.5-flash"), **_: Any) -> Any:
        return self.client.models.generate_content(model=model, contents=prompt)

    def embed(self, texts, model: str = os.getenv("GEMINI_MODEL_EMBEDDING", "gemini-embedding-001"), **_: Any):
        response = self.client.models.embed_content(model=model, contents=texts)
        return [emb.values for emb in response.embeddings]

# -----------------------------------------------------------------
# Groq provider implementation (optional, requires groq)
# -----------------------------------------------------------------
class GroqProvider(BaseProvider):
    def __init__(self):
        from groq import Groq
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key or api_key == "YOUR_GROQ_API_KEY":
            raise RuntimeError("GROQ_API_KEY is not configured in .env")
        self.client = Groq(api_key=api_key)

    def generate(self, prompt: str, model: str = os.getenv("GROQ_MODEL_LLM", "llama-3.3-70b-versatile"), temperature: float = 0.0, **_: Any) -> Any:
        actual_model = "openai/gpt-oss-120b"
        if "27b" in model.lower() or "qwen" in model.lower():
            actual_model = "qwen/qwen3.8-27b"
        elif "20b" in model.lower():
            actual_model = "openai/gpt-oss-20b"
        elif "120b" in model.lower() or "gpt" in model.lower() or model.lower() in ["groq", "llama-3.3-70b-versatile", "groq-llama3-8b"]:
            actual_model = "openai/gpt-oss-120b"
        elif not model.lower().startswith("groq"):
            actual_model = model

        response = self.client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=actual_model,
            temperature=temperature
        )
        return {
            "response": response.choices[0].message.content,
            "prompt_eval_count": getattr(response.usage, "prompt_tokens", 0) if hasattr(response, "usage") else 0,
            "eval_count": getattr(response.usage, "completion_tokens", 0) if hasattr(response, "usage") else 0
        }

    def embed(self, texts, **_: Any):
        # Groq currently focuses on LLMs; fall back to Ollama or Gemini embeddings
        from providers.provider_manager import OllamaProvider
        return OllamaProvider().embed(texts)

# -----------------------------------------------------------------
# Central manager that returns the appropriate provider at call time
# -----------------------------------------------------------------
class ProviderManager:
    @staticmethod
    def get_llm_provider() -> BaseProvider:
        name = (active_llm_provider() or "").lower()
        if name == "gemini":
            return GeminiProvider()
        elif name == "groq":
            return GroqProvider()
        return OllamaProvider()

    @staticmethod
    def get_embed_provider() -> BaseProvider:
        name = (active_embed_provider() or "").lower()
        if name == "gemini":
            return GeminiProvider()
        return OllamaProvider()
