# Overall Synthesis Agent Result Schema
from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class OverallFinding(BaseModel):
    title: str
    description: str
    page: int

class OverallAgentResult(BaseModel):
    summary: str
    findings: List[OverallFinding]
    recommendations: List[str]
    confidence_rating: str
    agent: Literal["Overall Synthesis Agent"] = Field(default="Overall Synthesis Agent")
