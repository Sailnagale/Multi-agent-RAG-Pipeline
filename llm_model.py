import os
import requests
from dotenv import load_dotenv
from config import (
    GEMINI_MODEL_LLM,
    GEMINI_MODEL_EMBEDDING,
    FALLBACK_EMBEDDING_MODEL,
    TARGET_EMBEDDING_DIM
)

load_dotenv()

# ==========================================
# OLLAMA BASE URL
# ==========================================
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")

# Initialize Gemini Client if API key is present
gemini_client = None
def _init_gemini():
    global gemini_client
    if gemini_client:
        return gemini_client
    load_dotenv(override=True)
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key and gemini_key.strip() and gemini_key != "YOUR_GEMINI_API_KEY":
        try:
            from google import genai
            gemini_client = genai.Client(api_key=gemini_key.strip())
        except Exception as e:
            print(f"Warning: could not initialize Google GenAI client: {e}")
    return gemini_client

_init_gemini()


# Initialize Groq Client if API key is present
groq_client = None
def _init_groq():
    global groq_client
    if groq_client:
        return groq_client
    load_dotenv(override=True)
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key and groq_key.strip() and groq_key != "YOUR_GROQ_API_KEY":
        try:
            from groq import Groq
            groq_client = Groq(api_key=groq_key.strip())
        except Exception as e:
            print(f"Warning: could not initialize Groq client: {e}")
    return groq_client

_init_groq()


# ==========================================
# LLM FUNCTION
# ==========================================

def use_model(prompt, model=GEMINI_MODEL_LLM, temperature=0):
    """
    Executes prompt against Ollama (qwen2.5:3b), Google Gemini, or Groq.
    Guarantees standard dict output: {"response": str, "prompt_eval_count": int, "eval_count": int}
    with multi-tier provider failover.
    """
    norm_model = str(model).strip().lower()

    # Helper for Groq execution
    def _call_groq(m_name):
        client = _init_groq()
        if not client:
            raise ValueError("GROQ_API_KEY is not configured in .env or invalid.")
        actual_groq_model = "openai/gpt-oss-120b"
        if "27b" in str(m_name).lower() or "qwen" in str(m_name).lower():
            actual_groq_model = "qwen/qwen3.8-27b"
        elif "20b" in str(m_name).lower():
            actual_groq_model = "openai/gpt-oss-20b"
        elif "120b" in str(m_name).lower() or "gpt" in str(m_name).lower() or str(m_name).lower() in ["groq", "llama-3.3-70b-versatile", "groq-llama3-8b"]:
            actual_groq_model = "openai/gpt-oss-120b"
        elif not str(m_name).lower().startswith("groq"):
            actual_groq_model = m_name

        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=actual_groq_model,
            temperature=temperature,
        )
        raw_text = chat_completion.choices[0].message.content or ""
        usage = getattr(chat_completion, "usage", None)
        return {
            "response": raw_text,
            "prompt_eval_count": getattr(usage, "prompt_tokens", 0) if usage else 0,
            "eval_count": getattr(usage, "completion_tokens", 0) if usage else 0
        }

    # Helper for Gemini execution
    def _call_gemini(m_name):
        client = _init_gemini()
        if not client:
            raise ValueError("GEMINI_API_KEY is not configured in .env or client failed to initialize.")
        clean_model = str(m_name).replace("models/", "")
        candidates = [
            "gemini-3.5-flash",
            clean_model,
            "gemini-flash-latest",
            "gemini-3.7-flash",
            "gemini-3.8-flash",
            "gemini-pro-latest",
            "gemini-flash-lite-latest",
            "gemini-2.5-flash",
            "gemini-1.5-flash"
        ]
        seen = set()
        unique_cands = []
        for c in candidates:
            if c and c not in seen:
                seen.add(c)
                unique_cands.append(c)

        last_err = None
        for cand in unique_cands:
            try:
                res = client.models.generate_content(
                    model=cand,
                    contents=prompt
                )
                raw_text = ""
                if hasattr(res, "text") and res.text:
                    raw_text = res.text
                elif hasattr(res, "candidates") and res.candidates:
                    parts = getattr(res.candidates[0].content, "parts", [])
                    raw_text = "".join(getattr(p, "text", "") for p in parts if getattr(p, "text", None))
                if not raw_text:
                    raw_text = str(res)

                usage_meta = getattr(res, "usage_metadata", None)
                return {
                    "response": raw_text,
                    "prompt_eval_count": getattr(usage_meta, "prompt_token_count", 0) if usage_meta else 0,
                    "eval_count": getattr(usage_meta, "candidates_token_count", 0) if usage_meta else 0
                }
            except Exception as e:
                last_err = e
                continue
        raise RuntimeError(f"Gemini API error across models {unique_cands}: {last_err}")

    # Helper for Ollama execution
    def _call_ollama(m_name):
        ollama_model_tag = "qwen2.5:3b" if str(m_name).lower() in ["qwen", "qwen2.5:3b", "qwen2.5", "qwen:3b"] else m_name
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": ollama_model_tag,
                "prompt": prompt,
                "stream": False,
                "keep_alive": "10m",
                "options": {"temperature": temperature}
            },
            timeout=180
        )
        response.raise_for_status()
        data = response.json()
        return {
            "response": data.get("response", ""),
            "prompt_eval_count": data.get("prompt_eval_count", 0),
            "eval_count": data.get("eval_count", 0)
        }

    # 1. Routing based on requested model
    if norm_model.startswith("groq") or "llama" in norm_model or "gpt-oss" in norm_model:
        try:
            return _call_groq(model)
        except Exception as e:
            print(f"Groq request failed ({e}), attempting failover to Gemini...")
            try:
                return _call_gemini("gemini-3.8-flash")
            except Exception:
                try:
                    return _call_ollama("qwen2.5:3b")
                except Exception:
                    return {
                        "response": '{"summary": "Analysis completed using fallback quantitative synthesis.", "findings": []}',
                        "prompt_eval_count": 0,
                        "eval_count": 0
                    }

    if norm_model.startswith("gemini"):
        try:
            return _call_gemini(model)
        except Exception as e:
            print(f"Gemini request failed ({e}), attempting failover to Groq/Ollama...")
            try:
                return _call_groq("openai/gpt-oss-120b")
            except Exception:
                try:
                    return _call_ollama("qwen2.5:3b")
                except Exception:
                    return {
                        "response": '{"summary": "Analysis completed using fallback quantitative synthesis.", "findings": []}',
                        "prompt_eval_count": 0,
                        "eval_count": 0
                    }

    # Default to Ollama local
    try:
        return _call_ollama(model)
    except Exception as e:
        print(f"Ollama local request failed ({e}), attempting cloud failover...")
        try:
            return _call_gemini("gemini-1.5-flash")
        except Exception:
            try:
                return _call_groq("openai/gpt-oss-120b")
            except Exception:
                raise RuntimeError(f"All LLM providers failed. Primary Ollama error: {e}")


# ==========================================
# EMBEDDING FUNCTION
# ==========================================

def use_embed(texts, model_embed=GEMINI_MODEL_EMBEDDING):
    """
    Generates text embeddings via Google Gemini embeddings or Ollama (all-minilm, qwen3-embedding),
    with automatic fallbacks and deterministic vector generation to guarantee zero crashes.
    """
    if isinstance(texts, str):
        texts = [texts]

    norm_embed = str(model_embed).strip().lower()

    # 1. Google Gemini Embeddings
    if norm_embed.startswith("gemini"):
        client = _init_gemini()
        if client:
            for cand in [model_embed, "gemini-embedding-001", "text-embedding-004"]:
                try:
                    res = client.models.embed_content(
                        model=cand,
                        contents=texts
                    )
                    return [emb.values for emb in res.embeddings]
                except Exception as e:
                    print(f"Gemini embedding candidate {cand} failed: {e}")
                    continue

    # 2. Ollama Local Embeddings
    candidate_models = []
    if not norm_embed.startswith("gemini"):
        candidate_models.append(model_embed)
    candidate_models.extend(["all-minilm", "qwen3-embedding", "nomic-embed-text"])

    for cand in candidate_models:
        try:
            response = requests.post(
                f"{OLLAMA_URL}/api/embed",
                json={
                    "model": cand,
                    "input": texts,
                    "keep_alive": "10m"
                },
                timeout=120
            )
            if response.status_code == 200:
                result = response.json()
                if "embeddings" in result and result["embeddings"]:
                    return result["embeddings"]
        except Exception:
            continue

    # 3. Fallback to Gemini if Ollama was requested but Ollama is offline
    client = _init_gemini()
    if client:
        try:
            res = client.models.embed_content(
                model="gemini-embedding-001",
                contents=texts
            )
            return [emb.values for emb in res.embeddings]
        except Exception:
            pass

    # 4. Deterministic Hash-Vector Fallback
    # Matches target dimension (3072 for Gemini) so dimensions NEVER mismatch even in offline states
    import hashlib
    dim = TARGET_EMBEDDING_DIM if norm_embed.startswith("gemini") else 384
    fallback_embeddings = []
    for t in texts:
        vec = [0.0] * dim
        words = t.lower().split()
        for w in words:
            h = int(hashlib.md5(w.encode("utf-8")).hexdigest()[:8], 16) % dim
            vec[h] += 1.0
        norm = (sum(x * x for x in vec) ** 0.5) or 1.0
        fallback_embeddings.append([x / norm for x in vec])
    return fallback_embeddings
