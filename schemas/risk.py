# Risk Agent Result Schema
from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class RiskFinding(BaseModel):
    title: str
    description: str
    risk_level: str  # e.g., High, Medium, Low
    mitigation: Optional[str] = None
    page: int

class RiskAgentResult(BaseModel):
    summary: str
    risks: List[RiskFinding]
    overall_risk: str
    cited_pages: List[int]
    agent: Literal["Risk Agent"] = Field(default="Risk Agent")
