import os
from typing import Dict

# Load initial values from .env (fallbacks are the defaults used elsewhere)
_current: Dict[str, str] = {
    "LLM_PRIMARY_PROVIDER": os.getenv("LLM_PRIMARY_PROVIDER", "ollama"),
    "EMBED_PRIMARY_PROVIDER": os.getenv("EMBED_PRIMARY_PROVIDER", "ollama"),
    # explicit model names (used when user selects a specific model)
    "LLM_MODEL": os.getenv("LLM_MODEL", "qwen2.5:3b"),
    "EMBED_MODEL": os.getenv("EMBED_MODEL", "all-minilm"),
}

def get(key: str) -> str:
    """Return the current value for *key* (or ``None`` if missing)."""
    return _current.get(key)

def set_(key: str, value: str) -> None:
    """Update *key* at runtime.  Called by the config ``PATCH`` endpoint."""
    _current[key] = value

def all() -> Dict[str, str]:
    """Return a shallow copy of the whole runtime config dictionary."""
    return _current.copy()
