# Financial Agent Result Schema
from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class FinancialMetric(BaseModel):
    metric_name: str
    value: str
    unit: Optional[str] = None
    page: int

class FinancialFinding(BaseModel):
    title: str
    description: str
    metric: Optional[FinancialMetric] = None
    quote: Optional[str] = None
    page: int

class FinancialAgentResult(BaseModel):
    summary: str
    key_metrics: List[FinancialMetric]
    analysis: List[FinancialFinding]
    confidence_rating: str
    cited_pages: List[int]
    agent: Literal["Financial Agent"] = Field(default="Financial Agent")
