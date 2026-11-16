# Negative Agent Result Schema
from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class NegativeFinding(BaseModel):
    title: str
    description: str
    metric: Optional[str] = None
    quote: Optional[str] = None
    severity: str
    page: int

class NegativeAgentResult(BaseModel):
    summary: str
    weaknesses: List[NegativeFinding]
    warning_signs: List[str]
    severity_level: str
    cited_pages: List[int]
    agent: Literal["Negative Agent"] = Field(default="Negative Agent")
