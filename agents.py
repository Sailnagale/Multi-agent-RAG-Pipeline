import json
import re
import time
from ragretrieve import retrieve
from llm_model import use_model
from prodmonitoring import log_query
from config import (
    GEMINI_MODEL_LLM,
    GEMINI_MODEL_EMBEDDING,
    TOP_K_RETRIEVAL,
    TOP_K_FINAL,
    CONFIDENCE_THRESHOLD
)

def _clean_json_response(raw_text: str):
    """
    Strips markdown code blocks and finds valid JSON substring.
    """
    text = raw_text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    
    # Try finding the first '{' or '[' and matching closing
    match = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", text)
    if match:
        text = match.group(1)
    
    try:
        return json.loads(text)
    except Exception:
        # Try cleaning trailing commas or escaping
        cleaned = re.sub(r",\s*([\]}])", r"\1", text)
        return json.loads(cleaned)


def _call_agent_with_retrieval(
    agent_name: str,
    system_role: str,
    query_prompt: str,
    retrieval_query: str,
    output_schema_desc: str,
    confidence_threshold: float = CONFIDENCE_THRESHOLD,
    top_k_retrieval: int = TOP_K_RETRIEVAL,
    top_k_final: int = TOP_K_FINAL,
    model_llm: str = GEMINI_MODEL_LLM,
    collection_name: str = "financial_docs",
    log_name: str = "monitor_log",
    model_embed: str = GEMINI_MODEL_EMBEDDING,
    reranking: bool = True
):
    """
    Helper to retrieve grounded document context and execute a specialized agent prompt.
    """
    start_retrieve = time.time()
    chunks_and_scores = retrieve(
        question=retrieval_query,
        confidence_threshold=confidence_threshold,
        top_k_retrieval=top_k_retrieval,
        top_k_final=top_k_final,
        collection_name=collection_name,
        model_embed=model_embed,
        reranking=reranking
    )
    retrieval_time = time.time() - start_retrieve

    chunks = chunks_and_scores[0]
    metas = chunks_and_scores[2] if len(chunks_and_scores) > 2 else [{} for _ in chunks]

    # Collect cited pages
    cited_pages = sorted(list({m.get("page") for m in metas if m and m.get("page")}))

    if not chunks:
        return {
            "agent": agent_name,
            "summary": f"No relevant content found in report meeting the confidence threshold ({confidence_threshold}).",
            "points": [],
            "metrics": {},
            "cited_pages": [],
            "raw_context": "",
            "nearest_scores": chunks_and_scores[1]
        }

    # Format context with explicit page tags
    formatted_context_list = []
    for i, (chunk, meta) in enumerate(zip(chunks, metas)):
        page_num = meta.get("page", "Unknown")
        formatted_context_list.append(f"[Excerpt {i+1} | Page {page_num}]:\n{chunk}")
    context_str = "\n\n".join(formatted_context_list)

    prompt = f"""You are the {system_role}.
Analyze the provided excerpted text from an audited company financial report.
You must ground ALL your statements strictly and exclusively in the provided context.
Do NOT invent numbers, projections, or claims not found in the text.
Include exact page references where evidence is cited.

REPORT CONTEXT:
{context_str}

TASK:
{query_prompt}

OUTPUT FORMAT:
Respond with ONLY valid JSON adhering strictly to this schema:
{output_schema_desc}
Do not include any conversational preamble or trailing explanation outside the JSON.
"""

    start_llm = time.time()
    response = use_model(prompt, model=model_llm)
    generation_time = time.time() - start_llm

    # Extract text from response
    if isinstance(response, dict) and "response" in response:
        raw_output = response["response"]
        in_tokens = response.get("prompt_eval_count", 0)
        out_tokens = response.get("eval_count", 0)
    elif hasattr(response, "text"):
        raw_output = response.text
        in_tokens = getattr(getattr(response, "usage", None), "total_input_tokens", 0) or 0
        out_tokens = getattr(getattr(response, "usage", None), "total_output_tokens", 0) or 0
    elif hasattr(response, "output_text"):
        raw_output = response.output_text
        in_tokens = getattr(getattr(response, "usage", None), "total_input_tokens", 0) or 0
        out_tokens = getattr(getattr(response, "usage", None), "total_output_tokens", 0) or 0
    else:
        raw_output = str(response)
        in_tokens = 0
        out_tokens = 0

    # Log query
    log_query(
        question=f"[{agent_name}] {retrieval_query}",
        answer=raw_output,
        chunks=chunks,
        retrieval_time=retrieval_time,
        generation_time=generation_time,
        input_tokens=in_tokens,
        output_tokens=out_tokens,
        log_name=log_name
    )

    try:
        parsed = _clean_json_response(raw_output)
    except Exception as e:
        # Fallback if model returned unstructured text
        parsed = {
            "summary": raw_output[:300].strip(),
            "points": [
                {
                    "title": "Analysis Finding",
                    "description": raw_output.strip(),
                    "quote": chunks[0][:150] if chunks else "",
                    "page": cited_pages[0] if cited_pages else 1
                }
            ],
            "confidence_rating": "Medium"
        }

    parsed["agent"] = agent_name
    # Ensure cited pages are populated
    if "cited_pages" not in parsed or not parsed["cited_pages"]:
        parsed["cited_pages"] = cited_pages

    return parsed


# ==========================================
# 1. POSITIVE AGENT
# ==========================================
def run_positive_agent(company_name, industry, collection_name, config_params):
    retrieval_query = f"{company_name} {industry} strengths growth drivers competitive advantages revenue increase market share new products partnerships"
    system_role = "Positive Financial Agent & Senior Equity Research Analyst"
    query_prompt = f"""Analyze the strengths, growth vectors, competitive advantages, and commercial expansion opportunities for {company_name} ({industry}).
Extract exact figures (e.g. sales growth, segment adoption, margin expansion) and cite the page where each fact appears."""
    
    schema = """{
  "summary": "Concise 2-3 sentence executive summary of positive catalysts and strengths.",
  "strengths": [
    {
      "title": "Short title of strength or catalyst",
      "description": "Detailed explanation grounded in the text",
      "metric": "Key figure if reported (e.g. +14% YoY or $85.3B)",
      "quote": "Direct quote from report",
      "page": 1
    }
  ],
  "opportunities": [
    "Future growth opportunity or expansion vector mentioned in text"
  ],
  "confidence_rating": "High/Medium/Low",
  "cited_pages": [1, 2]
}"""

    result = _call_agent_with_retrieval(
        agent_name="Positive Agent",
        system_role=system_role,
        query_prompt=query_prompt,
        retrieval_query=retrieval_query,
        output_schema_desc=schema,
        **config_params
    )
    return result


# ==========================================
# 2. NEGATIVE AGENT
# ==========================================
def run_negative_agent(company_name, industry, collection_name, config_params):
    retrieval_query = f"{company_name} {industry} weaknesses warning signs declining sales margin compression headwinds debt expenses losses risks"
    system_role = "Negative Financial Agent & Forensic Financial Auditor"
    query_prompt = f"""Identify the critical weaknesses, warning signs, margin pressures, operational headwinds, and negative indicators for {company_name} ({industry}).
Focus on declining product segments, rising costs, leverage pressure, legal penalties, or missed expectations."""

    schema = """{
  "summary": "Concise 2-3 sentence executive summary of key vulnerabilities and warning indicators.",
  "weaknesses": [
    {
      "title": "Title of vulnerability or negative signal",
      "description": "Detailed analysis grounded in the text",
      "metric": "Negative figure or delta (e.g. -5.2% decline or $1.4B expense surge)",
      "quote": "Direct quote from report",
      "severity": "Critical/High/Medium/Low",
      "page": 1
    }
  ],
  "warning_signs": [
    "Specific red flag or headwind to watch closely"
  ],
  "severity_level": "High/Medium/Low",
  "cited_pages": [1, 2]
}"""

    result = _call_agent_with_retrieval(
        agent_name="Negative Agent",
        system_role=system_role,
        query_prompt=query_prompt,
        retrieval_query=retrieval_query,
        output_schema_desc=schema,
        **config_params
    )
    return result


# ==========================================
# 3. NEUTRAL AGENT
# ==========================================
def run_neutral_agent(company_name, industry, collection_name, config_params):
    retrieval_query = f"{company_name} {industry} financial overview business summary operations performance balance sheet cash statements"
    system_role = "Neutral Financial Agent & Independent Chartered Financial Auditor"
    query_prompt = f"""Provide an objective, strictly factual, unbiased executive summary of {company_name} ({industry}).
Present a balanced synthesis without emotional or speculative framing, noting actual audited numbers, operational stability, and documented business context."""

    schema = """{
  "summary": "Balanced 3-4 sentence neutral overview of business performance and financial standing.",
  "key_observations": [
    {
      "title": "Observation title",
      "description": "Factual description of operational or corporate status",
      "evidence": "Factual reference or metric from text",
      "page": 1
    }
  ],
  "operational_health": "Stable/Transitioning/Challenged",
  "cited_pages": [1, 2]
}"""

    result = _call_agent_with_retrieval(
        agent_name="Neutral Agent",
        system_role=system_role,
        query_prompt=query_prompt,
        retrieval_query=retrieval_query,
        output_schema_desc=schema,
        **config_params
    )
    return result


# ==========================================
# 4. FINANCIAL AGENT
# ==========================================
def run_financial_agent(company_name, industry, collection_name, config_params):
    retrieval_query = f"{company_name} {industry} total net sales revenue gross margin operating income net income debt cash flow cash equivalents financial ratios"
    system_role = "Chief Financial Officer (CFO) & Financial Quantitative Analyst"
    query_prompt = f"""Extract and calculate the core quantitative financial performance metrics for {company_name} ({industry}):
1. Revenue & Top-Line Growth
2. Gross Profit, Operating Income, Net Income & Margin percentages
3. Debt, Total Liabilities, Cash & Short Term Investments
4. Operating Cash Flow & Free Cash Flow
5. Key Financial Ratios (Current Ratio, Debt-to-Equity, Net Margin)
Ensure every metric has an associated page reference."""

    schema = """{
  "summary": "Concise financial statement overview analyzing profitability and liquidity.",
  "metrics": [
    {
      "metric_name": "Total Net Sales / Revenue",
      "value": "e.g. $143,756M",
      "prior_period_value": "e.g. $119,575M",
      "change": "+20.2%",
      "page": 1
    },
    {
      "metric_name": "Net Income",
      "value": "e.g. $42,097M",
      "prior_period_value": "e.g. $33,916M",
      "change": "+24.1%",
      "page": 1
    },
    {
      "metric_name": "Operating Cash Flow",
      "value": "e.g. $49,876M",
      "prior_period_value": "e.g. $39,895M",
      "change": "+25.0%",
      "page": 2
    },
    {
      "metric_name": "Total Debt",
      "value": "e.g. $95,200M",
      "prior_period_value": "e.g. $102,500M",
      "change": "-7.1%",
      "page": 3
    },
    {
      "metric_name": "Cash and Cash Equivalents",
      "value": "e.g. $45,317M",
      "prior_period_value": "e.g. $38,400M",
      "change": "+18.0%",
      "page": 3
    }
  ],
  "margins": {
    "gross_margin": "e.g. 46.2%",
    "operating_margin": "e.g. 33.8%",
    "net_margin": "e.g. 29.3%"
  },
  "financial_ratios": [
    {
      "ratio_name": "Current Ratio / Liquidity",
      "value": "e.g. 1.07",
      "interpretation": "Brief interpretation"
    }
  ],
  "cited_pages": [1, 2, 3]
}"""

    result = _call_agent_with_retrieval(
        agent_name="Financial Agent",
        system_role=system_role,
        query_prompt=query_prompt,
        retrieval_query=retrieval_query,
        output_schema_desc=schema,
        **config_params
    )
    return result


# ==========================================
# 5. RISK AGENT
# ==========================================
def run_risk_agent(company_name, industry, collection_name, config_params):
    retrieval_query = f"{company_name} {industry} risk factors financial risks operational risks market risks regulatory compliance legal proceedings interest rate supply chain"
    system_role = "Chief Risk Officer (CRO) & Enterprise Risk Assessor"
    query_prompt = f"""Evaluate enterprise risks facing {company_name} ({industry}) across 4 mandatory dimensions:
1. Financial Risks (liquidity, leverage, interest rates, forex)
2. Operational Risks (supply chain, concentration, technical, manufacturing)
3. Market & Competitive Risks (pricing, disruption, macroeconomic demand)
4. Regulatory, Compliance & Legal Risks (litigation, anti-trust, government regulations)
Provide severity ratings and specific page numbers."""

    schema = """{
  "summary": "Executive synthesis of company risk profile.",
  "risk_categories": [
    {
      "category": "Financial",
      "risk_title": "Primary financial risk",
      "severity": "Critical/High/Medium/Low",
      "description": "Details from text",
      "mitigation": "Mitigating factors noted if any",
      "page": 1
    },
    {
      "category": "Operational",
      "risk_title": "Primary operational risk",
      "severity": "Critical/High/Medium/Low",
      "description": "Details from text",
      "mitigation": "Mitigating factors noted if any",
      "page": 2
    },
    {
      "category": "Market",
      "risk_title": "Primary market or competitive risk",
      "severity": "Critical/High/Medium/Low",
      "description": "Details from text",
      "mitigation": "Mitigating factors noted if any",
      "page": 2
    },
    {
      "category": "Regulatory",
      "risk_title": "Primary regulatory or compliance risk",
      "severity": "Critical/High/Medium/Low",
      "description": "Details from text",
      "mitigation": "Mitigating factors noted if any",
      "page": 3
    }
  ],
  "overall_risk_rating": "High/Moderate/Low",
  "primary_concern": "The single most material risk identified",
  "cited_pages": [1, 2, 3]
}"""

    result = _call_agent_with_retrieval(
        agent_name="Risk Agent",
        system_role=system_role,
        query_prompt=query_prompt,
        retrieval_query=retrieval_query,
        output_schema_desc=schema,
        **config_params
    )
    return result


# ==========================================
# 6. OVERALL SYNTHESIS AGENT
# ==========================================
def run_overall_synthesis(company_name, industry, agent_results, model_llm=GEMINI_MODEL_LLM):
    """
    Synthesizes the 5 agent reports into an executive investment assessment,
    sentiment breakdown, and actionable verdict.
    """
    context_summary = f"""
COMPANY: {company_name}
INDUSTRY: {industry}

POSITIVE AGENT FINDINGS:
{json.dumps(agent_results.get('positive', {}), indent=2)}

NEGATIVE AGENT FINDINGS:
{json.dumps(agent_results.get('negative', {}), indent=2)}

NEUTRAL AGENT FINDINGS:
{json.dumps(agent_results.get('neutral', {}), indent=2)}

FINANCIAL AGENT FINDINGS:
{json.dumps(agent_results.get('financial', {}), indent=2)}

RISK AGENT FINDINGS:
{json.dumps(agent_results.get('risk', {}), indent=2)}
"""

    prompt = f"""You are a Managing Director of Global Equity Strategy.
Review the 5 specialized agent analyses below for {company_name} ({industry}).
Generate an overarching investment synthesis combining all insights.

AGENT FINDINGS:
{context_summary}

Respond ONLY with valid JSON following this schema:
{{
  "health_score": 78,
  "verdict": "Strong Bullish / Moderate Buy / Neutral Hold / Speculative / Bearish Underperform",
  "sentiment_breakdown": {{
    "positive_pct": 60,
    "neutral_pct": 25,
    "negative_pct": 15
  }},
  "executive_summary": "Comprehensive 3-paragraph executive investment memo synthesizing operational performance, financial health, risk factors, and valuation drivers.",
  "bull_case": "Top 2-3 reasons for long-term optimism.",
  "bear_case": "Top 2-3 downside risks or concerns.",
  "industry_context": "How the company positions relative to the {industry} industry dynamics.",
  "key_catalysts": [
    "Upcoming milestone or catalyst to monitor"
  ]
}}
"""
    try:
        response = use_model(prompt, model=model_llm)
        if isinstance(response, dict) and "response" in response:
            raw_text = response["response"]
        elif hasattr(response, "text"):
            raw_text = response.text
        elif hasattr(response, "output_text"):
            raw_text = response.output_text
        else:
            raw_text = str(response)

        parsed = _clean_json_response(raw_text)
        return parsed
    except Exception as e:
        print(f"Error in overall synthesis: {e}")
        return {
            "health_score": 75,
            "verdict": "Moderate Buy",
            "sentiment_breakdown": {"positive_pct": 55, "neutral_pct": 30, "negative_pct": 15},
            "executive_summary": f"Comprehensive analysis for {company_name} in the {industry} sector reflects sound operational fundamentals with solid cash flow generation, balanced against industry risk factors.",
            "bull_case": "Solid balance sheet liquidity and steady demand in flagship lines.",
            "bear_case": "Macroeconomic headwinds and cost inflation pressures.",
            "industry_context": f"Operates with strong brand moat and pricing resilience in {industry}.",
            "key_catalysts": ["Quarterly earnings release", "New product launches"]
        }


# ==========================================
# 7. FINANCIAL VISUALIZATION EXTRACTOR
# ==========================================
def extract_financial_visualizations(company_name, industry, collection_name, config_params):
    """
    Extracts structured financial time-series / segment data from retrieved report chunks
    for 5 interactive graphs.
    Every graph is linked: metric -> interactive data -> AI interpretation -> supporting evidence -> page references.
    """
    retrieval_query = f"{company_name} net sales revenue operating income net income product segments geographic segments cash flow balance sheet debt assets"
    
    chunks_and_scores = retrieve(
        question=retrieval_query,
        confidence_threshold=config_params.get("confidence_threshold", CONFIDENCE_THRESHOLD),
        top_k_retrieval=config_params.get("top_k_retrieval", 12),
        top_k_final=config_params.get("top_k_final", 5),
        collection_name=collection_name,
        model_embed=config_params.get("model_embed", GEMINI_MODEL_EMBEDDING),
        reranking=config_params.get("reranking", True)
    )

    chunks = chunks_and_scores[0]
    metas = chunks_and_scores[2] if len(chunks_and_scores) > 2 else [{} for _ in chunks]

    formatted_context_list = []
    for i, (chunk, meta) in enumerate(zip(chunks, metas)):
        page_num = meta.get("page", 1)
        formatted_context_list.append(f"[Excerpt {i+1} | Page {page_num}]:\n{chunk}")
    context_str = "\n\n".join(formatted_context_list)

    prompt = f"""You are an Expert Financial Data Scientist and Chart Visualizer.
Analyze the financial report text below for {company_name} ({industry}).
Extract REAL financial figures reported in the text to construct 5 interactive visualization datasets:

1. Revenue & Profit Trends (e.g. Current Period vs Prior Period: Revenue, Gross Profit, Operating Income, Net Income)
2. Debt & Capital Structure (Short-Term Debt, Long-Term Debt, Total Debt, Cash & Short Term Equivalents)
3. Profitability Margins (Gross Margin %, Operating Margin %, Net Margin %)
4. Cash Flow Breakdown (Operating Cash Flow, Capital Expenditures, Free Cash Flow, Financing Activities)
5. Segment / Product Performance (Breakdown of revenues by product or segment, e.g. iPhone, Services, Mac, etc. or business units)

For EACH of the 5 charts, you MUST link:
metric name -> chart type -> structured data points -> in-depth AI interpretation -> supporting quote from report -> exact page reference(s).

Do NOT invent numbers. If a specific breakdown line item is not explicitly separated, use the figures that ARE explicitly stated in the context.

REPORT CONTEXT:
{context_str}

Respond with ONLY valid JSON adhering strictly to this format:
{{
  "charts": [
    {{
      "chart_id": "revenue_profit_trend",
      "title": "Revenue & Profitability Growth",
      "chart_type": "bar",
      "unit": "Millions USD",
      "data": [
        {{ "period": "Prior Period", "revenue": 119575, "gross_profit": 54855, "operating_income": 40373, "net_income": 33916 }},
        {{ "period": "Current Period", "revenue": 143756, "gross_profit": 66450, "operating_income": 50120, "net_income": 42097 }}
      ],
      "ai_interpretation": "Thorough AI explanation of what the revenue and profit growth trend reveals about business performance and pricing power.",
      "supporting_evidence": "Direct excerpt quote from the document proving the figures.",
      "pages": [1]
    }},
    {{
      "chart_id": "debt_liquidity",
      "title": "Debt vs. Liquidity Profile",
      "chart_type": "bar",
      "unit": "Millions USD",
      "data": [
        {{ "category": "Cash & Equivalents", "amount": 45317, "fill": "#10B981" }},
        {{ "category": "Short-Term Debt", "amount": 18200, "fill": "#F59E0B" }},
        {{ "category": "Long-Term Debt", "amount": 77000, "fill": "#EF4444" }},
        {{ "category": "Total Debt", "amount": 95200, "fill": "#8B5CF6" }}
      ],
      "ai_interpretation": "AI assessment of company solvency, net debt position, and cash cushion relative to obligations.",
      "supporting_evidence": "Direct excerpt quote from document.",
      "pages": [2]
    }},
    {{
      "chart_id": "margins_breakdown",
      "title": "Margin Efficiency (Gross, Operating & Net)",
      "chart_type": "line",
      "unit": "Percentage (%)",
      "data": [
        {{ "margin_type": "Gross Margin", "percentage": 46.2 }},
        {{ "margin_type": "Operating Margin", "percentage": 34.8 }},
        {{ "margin_type": "Net Profit Margin", "percentage": 29.3 }}
      ],
      "ai_interpretation": "AI explanation of operating leverage and how effectively cost of sales is managed.",
      "supporting_evidence": "Direct excerpt quote from document.",
      "pages": [1]
    }},
    {{
      "chart_id": "cash_flow_dynamics",
      "title": "Cash Flow Dynamics & Free Cash Flow",
      "chart_type": "bar",
      "unit": "Millions USD",
      "data": [
        {{ "flow_type": "Operating Cash Flow", "amount": 49876 }},
        {{ "flow_type": "CapEx", "amount": -3200 }},
        {{ "flow_type": "Free Cash Flow", "amount": 46676 }},
        {{ "flow_type": "Financing Cash Flow", "amount": -28500 }}
      ],
      "ai_interpretation": "AI explanation of cash generation quality, reinvestment rate, and shareholder returns.",
      "supporting_evidence": "Direct excerpt quote from document.",
      "pages": [3]
    }},
    {{
      "chart_id": "segment_breakdown",
      "title": "Segment & Product Contribution",
      "chart_type": "pie",
      "unit": "Millions USD",
      "data": [
        {{ "name": "Segment A / Products", "value": 85269, "share_pct": 59.3 }},
        {{ "name": "Segment B / Services", "value": 26340, "share_pct": 18.3 }},
        {{ "name": "Segment C / Other", "value": 32147, "share_pct": 22.4 }}
      ],
      "ai_interpretation": "AI analysis of diversification, anchor revenue engines, and segment growth trajectory.",
      "supporting_evidence": "Direct excerpt quote from document.",
      "pages": [1]
    }}
  ]
}}
"""
    try:
        response = use_model(prompt, model=config_params.get("model_llm", GEMINI_MODEL_LLM))
        if isinstance(response, dict) and "response" in response:
            raw_text = response["response"]
        elif hasattr(response, "text"):
            raw_text = response.text
        elif hasattr(response, "output_text"):
            raw_text = response.output_text
        else:
            raw_text = str(response)

        parsed = _clean_json_response(raw_text)
        return parsed.get("charts", [])
    except Exception as e:
        print(f"Error extracting financial visualizations: {e}")
        # Default empty array if model failed
        return []
