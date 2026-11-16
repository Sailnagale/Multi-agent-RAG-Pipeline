import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from runtime_config import get as cfg_get, set_ as cfg_set, all as cfg_all

router = APIRouter()

class ConfigUpdate(BaseModel):
    llm_provider: Optional[str] = None      # "ollama" | "gemini"
    embed_provider: Optional[str] = None
    model_llm: Optional[str] = None         # e.g. "gemini-1.5-flash"
    model_embed: Optional[str] = None       # e.g. "gemini-embedding-001"

@router.get("/api/config")
def get_config():
    """Return the full mutable config dictionary."""
    return cfg_all()

@router.patch("/api/config")
def update_config(update: ConfigUpdate):
    """Update runtime config – only supplied fields are changed."""
    if update.llm_provider:
        if update.llm_provider not in {"ollama", "gemini", "groq"}:
            raise HTTPException(status_code=400, detail="Invalid llm_provider (must be 'ollama', 'gemini', or 'groq')")
        cfg_set("LLM_PRIMARY_PROVIDER", update.llm_provider)
    if update.embed_provider:
        if update.embed_provider not in {"ollama", "gemini"}:
            raise HTTPException(status_code=400, detail="Invalid embed_provider (must be 'ollama' or 'gemini')")
        cfg_set("EMBED_PRIMARY_PROVIDER", update.embed_provider)
    if update.model_llm:
        cfg_set("LLM_MODEL", update.model_llm)
    if update.model_embed:
        cfg_set("EMBED_MODEL", update.model_embed)
    return {"status": "ok", "config": cfg_all()}
