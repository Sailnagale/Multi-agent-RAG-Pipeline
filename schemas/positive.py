# Positive Agent Result Schema
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Literal

class PositiveFinding(BaseModel):
    title: str
    description: str
    metric: Optional[str] = None
    quote: Optional[str] = None
    page: int

class PositiveAgentResult(BaseModel):
    summary: str
    strengths: List[PositiveFinding]
    opportunities: List[str]
    confidence_rating: str
    cited_pages: List[int]
    agent: Literal["Positive Agent"] = Field(default="Positive Agent")
