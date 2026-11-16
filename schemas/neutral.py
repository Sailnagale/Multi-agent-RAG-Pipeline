# Neutral Agent Result Schema
from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class NeutralFinding(BaseModel):
    title: str
    description: str
    metric: Optional[str] = None
    quote: Optional[str] = None
    page: int

class NeutralAgentResult(BaseModel):
    summary: str
    observations: List[NeutralFinding]
    implications: List[str]
    confidence_rating: str
    cited_pages: List[int]
    agent: Literal["Neutral Agent"] = Field(default="Neutral Agent")
