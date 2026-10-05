import os
import json
import uuid
import time
import tempfile
import fitz
from datetime import datetime
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from config import (
    GEMINI_MODEL_LLM,
    GEMINI_MODEL_EMBEDDING,
    FALLBACK_EMBEDDING_MODEL,
    CHUNK_SIZE,
    CHUNK_OVERLAP,
    TOP_K_RETRIEVAL,
    TOP_K_FINAL,
    CONFIDENCE_THRESHOLD,
    LOG_FILE,
    INDUSTRIES,
    HISTORY_FILE
)
from ingestpdf import create_embedding_index, pdf_load, html_load
from ragretrieve import retrieve
from aiapi import ask
from prodmonitoring import log_query
from evaluate import parse_golden_dataset, evaluate
from agents import (
    run_positive_agent,
    run_negative_agent,
    run_neutral_agent,
    run_financial_agent,
    run_risk_agent,
    run_overall_synthesis,
    extract_financial_visualizations
)
import chromadb

# Initialize FastAPI App
app = FastAPI(
    title="Financial Report RAG & Multi-Agent Intelligence API",
    description="Backend API powering the 5-Agent Financial Analysis Platform",
    version="2.0.0"
)

# Enable CORS for React development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# HISTORY STORAGE HELPERS
# ==========================================

def _load_history() -> List[Dict[str, Any]]:
    if not os.path.exists(HISTORY_FILE):
        return []
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading history: {e}")
        return []

def _save_history(history: List[Dict[str, Any]]):
    try:
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving history: {e}")


# ==========================================
# PYDANTIC SCHEMAS
# ==========================================

class AnalyzeRequest(BaseModel):
    collection_name: str
    company_name: str
    industry: str
    report_date: Optional[str] = None
    model_llm: Optional[str] = GEMINI_MODEL_LLM
    model_embed: Optional[str] = GEMINI_MODEL_EMBEDDING
    confidence_threshold: Optional[float] = CONFIDENCE_THRESHOLD
    top_k_retrieval: Optional[int] = TOP_K_RETRIEVAL
    top_k_final: Optional[int] = TOP_K_FINAL
    reranking: Optional[bool] = True

class ChatRequest(BaseModel):
    question: str
    collection_name: str
    model_llm: Optional[str] = GEMINI_MODEL_LLM
    model_embed: Optional[str] = GEMINI_MODEL_EMBEDDING
    confidence_threshold: Optional[float] = CONFIDENCE_THRESHOLD
    top_k_retrieval: Optional[int] = TOP_K_RETRIEVAL
    top_k_final: Optional[int] = TOP_K_FINAL
    reranking: Optional[bool] = True

class EvaluateRequest(BaseModel):
    dataset_content: str
    collection_name: str
    model_llm: Optional[str] = GEMINI_MODEL_LLM
    model_embed: Optional[str] = GEMINI_MODEL_EMBEDDING
    model_judge: Optional[str] = GEMINI_MODEL_LLM
    confidence_threshold: Optional[float] = CONFIDENCE_THRESHOLD
    top_k_retrieval: Optional[int] = TOP_K_RETRIEVAL
    top_k_final: Optional[int] = TOP_K_FINAL
    reranking: Optional[bool] = True

class ConfigUpdateRequest(BaseModel):
    model_llm: Optional[str] = None
    model_embed: Optional[str] = None
    confidence_threshold: Optional[float] = None
    top_k_retrieval: Optional[int] = None
    top_k_final: Optional[int] = None
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None


# ==========================================
# API ROUTES
# ==========================================

@app.get("/api/health")
def health_check():
    # Check Ollama connectivity
    ollama_active = False
    ollama_models = []
    try:
        import requests
        r = requests.get("http://localhost:11434/api/tags", timeout=2)
        if r.status_code == 200:
            ollama_active = True
            ollama_models = [m.get("name") for m in r.json().get("models", [])]
    except Exception:
        pass

    return {
        "status": "online",
        "timestamp": datetime.now().isoformat(),
        "ollama_connected": ollama_active,
        "ollama_models": ollama_models,
        "default_llm": GEMINI_MODEL_LLM,
        "default_embedding": GEMINI_MODEL_EMBEDDING,
        "industries": INDUSTRIES
    }


@app.get("/api/config")
def get_config():
    return {
        "model_llm": GEMINI_MODEL_LLM,
        "model_embed": GEMINI_MODEL_EMBEDDING,
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        "top_k_retrieval": TOP_K_RETRIEVAL,
        "top_k_final": TOP_K_FINAL,
        "chunk_size": CHUNK_SIZE,
        "chunk_overlap": CHUNK_OVERLAP,
        "industries": INDUSTRIES
    }


@app.post("/api/upload")
async def upload_document(
    file: UploadFile = File(...),
    chunk_size: int = Form(CHUNK_SIZE),
    chunk_overlap: int = Form(CHUNK_OVERLAP),
    model_embed: str = Form(GEMINI_MODEL_EMBEDDING),
    collection_name: Optional[str] = Form(None)
):
    """
    Uploads PDF or HTML report, extracts text and pages, chunks and persists into ChromaDB.
    Preserves original PDF parsing & chunking mechanics.
    """
    if not (file.filename.endswith(".pdf") or file.filename.endswith(".html")):
        raise HTTPException(status_code=400, detail="Only .pdf and .html files are supported.")

    # Assign collection name
    if not collection_name:
        collection_id = str(uuid.uuid4())[:8]
        clean_filename = os.path.splitext(file.filename)[0].replace(" ", "_")
        collection_name = f"col_{clean_filename}_{collection_id}"

    # Write uploaded file to temp directory
    suffix = ".pdf" if file.filename.endswith(".pdf") else ".html"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        contents = await file.read()
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        # Load pages to calculate metadata
        if file.filename.endswith(".pdf"):
            pages = pdf_load(tmp_path)
        else:
            pages = html_load(tmp_path)

        page_count = len(pages)
        sample_text = pages[0]["text"] if pages else ""

        # Auto-detect likely company name from first page text
        detected_company = ""
        for line in sample_text.splitlines()[:10]:
            clean_line = line.strip()
            if len(clean_line) > 2 and any(k in clean_line.lower() for k in ["inc", "corp", "ltd", "holdings", "company", "plc", "apple"]):
                detected_company = clean_line
                break
        if not detected_company and file.filename:
            detected_company = os.path.splitext(file.filename)[0].replace("_", " ").title()

        # Ingest into ChromaDB via existing create_embedding_index
        num_chunks = create_embedding_index(
            file_path=tmp_path,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            collection_name=collection_name,
            model_embed=model_embed
        )

        return {
            "status": "success",
            "filename": file.filename,
            "collection_name": collection_name,
            "page_count": page_count,
            "num_chunks": num_chunks,
            "detected_company": detected_company,
            "message": f"Successfully ingested {file.filename}: {page_count} pages, {num_chunks} chunks indexed."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to ingest file: {str(e)}")
    finally:
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass


@app.post("/api/analyze")
def analyze_report(req: AnalyzeRequest):
    """
    Executes the 5 Specialized Agents:
    1. Positive Agent (strengths, growth, opportunities)
    2. Negative Agent (weaknesses, warning signs, negative indicators)
    3. Neutral Agent (unbiased evidence-based summary)
    4. Financial Agent (revenue, profit, margins, debt, cash flow, financial ratios)
    5. Risk Agent (financial, operational, market, regulatory risks)
    Plus Overall Company Analysis & Financial Visualizations linked to AI explanations and page references.
    """
    start_time = time.time()
    config_params = {
        "confidence_threshold": req.confidence_threshold,
        "top_k_retrieval": req.top_k_retrieval,
        "top_k_final": req.top_k_final,
        "model_llm": req.model_llm,
        "model_embed": req.model_embed,
        "collection_name": req.collection_name,
        "reranking": req.reranking
    }

    try:
        # Run 5 Agents
        print(f"--> Running Positive Agent for {req.company_name}...")
        positive_res = run_positive_agent(req.company_name, req.industry, req.collection_name, config_params)

        print(f"--> Running Negative Agent for {req.company_name}...")
        negative_res = run_negative_agent(req.company_name, req.industry, req.collection_name, config_params)

        print(f"--> Running Neutral Agent for {req.company_name}...")
        neutral_res = run_neutral_agent(req.company_name, req.industry, req.collection_name, config_params)

        print(f"--> Running Financial Agent for {req.company_name}...")
        financial_res = run_financial_agent(req.company_name, req.industry, req.collection_name, config_params)

        print(f"--> Running Risk Agent for {req.company_name}...")
        risk_res = run_risk_agent(req.company_name, req.industry, req.collection_name, config_params)

        # Run Overall Synthesis
        agent_bundle = {
            "positive": positive_res,
            "negative": negative_res,
            "neutral": neutral_res,
            "financial": financial_res,
            "risk": risk_res
        }
        print(f"--> Running Overall Synthesis for {req.company_name}...")
        overall_res = run_overall_synthesis(req.company_name, req.industry, agent_bundle, model_llm=req.model_llm)

        # Extract Financial Visualizations
        print(f"--> Extracting Structured Financial Visualizations for {req.company_name}...")
        charts_res = extract_financial_visualizations(req.company_name, req.industry, req.collection_name, config_params)

        total_duration = round(time.time() - start_time, 2)

        # Build analysis record
        analysis_id = f"analysis_{uuid.uuid4().hex[:10]}"
        analysis_record = {
            "id": analysis_id,
            "company_name": req.company_name,
            "industry": req.industry,
            "report_date": req.report_date or datetime.now().strftime("%B %Y"),
            "timestamp": datetime.now().isoformat(),
            "collection_name": req.collection_name,
            "duration_sec": total_duration,
            "status": "Complete",
            "overall": overall_res,
            "agents": {
                "positive": positive_res,
                "negative": negative_res,
                "neutral": neutral_res,
                "financial": financial_res,
                "risk": risk_res
            },
            "visualizations": charts_res
        }

        # Persist to history
        history = _load_history()
        history.insert(0, analysis_record)
        _save_history(history)

        return analysis_record

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get("/api/history")
def get_history(search: Optional[str] = None, industry: Optional[str] = None):
    """
    Returns list of saved past analyses.
    """
    history = _load_history()
    filtered = []
    for item in history:
        if industry and industry != "All" and item.get("industry") != industry:
            continue
        if search:
            q = search.lower()
            if q not in item.get("company_name", "").lower() and q not in item.get("industry", "").lower():
                continue
        # Summarized card format
        filtered.append({
            "id": item["id"],
            "company_name": item.get("company_name", "Unknown"),
            "industry": item.get("industry", "Other"),
            "report_date": item.get("report_date", "N/A"),
            "timestamp": item.get("timestamp", ""),
            "status": item.get("status", "Complete"),
            "health_score": item.get("overall", {}).get("health_score", 70),
            "verdict": item.get("overall", {}).get("verdict", "N/A"),
            "collection_name": item.get("collection_name", "")
        })
    return filtered


@app.get("/api/history/{analysis_id}")
def get_analysis_detail(analysis_id: str):
    """
    Retrieves full analysis record by ID.
    """
    history = _load_history()
    for item in history:
        if item.get("id") == analysis_id:
            return item
    raise HTTPException(status_code=404, detail="Analysis record not found.")


@app.delete("/api/history/{analysis_id}")
def delete_analysis(analysis_id: str):
    """
    Deletes analysis record by ID.
    """
    history = _load_history()
    new_history = [item for item in history if item.get("id") != analysis_id]
    if len(new_history) == len(history):
        raise HTTPException(status_code=404, detail="Analysis record not found.")
    _save_history(new_history)
    return {"status": "success", "message": f"Deleted analysis {analysis_id}"}


@app.post("/api/chat")
def chat_document(req: ChatRequest):
    """
    Interactive RAG Chat querying the uploaded financial report chunks.
    Preserves exact ask() and retrieve() logic with citations.
    """
    start_time = time.time()
    chunks_and_scores = retrieve(
        question=req.question,
        confidence_threshold=req.confidence_threshold,
        top_k_retrieval=req.top_k_retrieval,
        top_k_final=req.top_k_final,
        collection_name=req.collection_name,
        model_embed=req.model_embed,
        reranking=req.reranking
    )
    retrieval_time = time.time() - start_time

    chunks = chunks_and_scores[0]
    scores = chunks_and_scores[1]
    metas = chunks_and_scores[2] if len(chunks_and_scores) > 2 else []

    if not chunks:
        return {
            "answer": f"Could not find relevant information in document (Confidence Threshold = {req.confidence_threshold}). Nearest cluster scores are {scores}.",
            "chunks": [],
            "scores": scores,
            "cited_pages": [],
            "retrieval_time_sec": round(retrieval_time, 3),
            "generation_time_sec": 0
        }

    # Format prompt and invoke LLM
    context = "\n\n".join(chunks)
    prompt = f"""Act as a financial assistant to help investors interpret financial reports.
Use ONLY the context below to answer the question. If the answer is not in the context, say "I couldn't find that in the document."
Cite specific facts and numbers accurately.

Context: {context}
Question: {req.question}

Answer:"""

    start_llm = time.time()
    from llm_model import use_model
    response = use_model(prompt, model=req.model_llm)
    generation_time = time.time() - start_llm

    if isinstance(response, dict) and "response" in response:
        answer_text = response["response"]
        in_tokens = response.get("prompt_eval_count", 0)
        out_tokens = response.get("eval_count", 0)
    elif hasattr(response, "text"):
        answer_text = response.text
        in_tokens = getattr(getattr(response, "usage", None), "total_input_tokens", 0) or 0
        out_tokens = getattr(getattr(response, "usage", None), "total_output_tokens", 0) or 0
    elif hasattr(response, "output_text"):
        answer_text = response.output_text
        in_tokens = getattr(getattr(response, "usage", None), "total_input_tokens", 0) or 0
        out_tokens = getattr(getattr(response, "usage", None), "total_output_tokens", 0) or 0
    else:
        answer_text = str(response)
        in_tokens = 0
        out_tokens = 0

    # Log query
    log_query(
        question=req.question,
        answer=answer_text,
        chunks=chunks,
        retrieval_time=retrieval_time,
        generation_time=generation_time,
        input_tokens=in_tokens,
        output_tokens=out_tokens,
        log_name=LOG_FILE.replace(".json", "")
    )

    cited_pages = sorted(list({m.get("page") for m in metas if m and m.get("page")}))

    return {
        "answer": answer_text,
        "chunks": chunks,
        "scores": scores,
        "cited_pages": cited_pages,
        "retrieval_time_sec": round(retrieval_time, 3),
        "generation_time_sec": round(generation_time, 3)
    }


@app.get("/api/monitoring/logs")
def get_monitoring_logs():
    """
    Returns RAG query monitoring logs and performance metrics.
    """
    log_filename = f"{LOG_FILE.replace('.json', '')}.json"
    if not os.path.exists(log_filename):
        return {
            "total_queries": 0,
            "avg_retrieval_sec": 0,
            "avg_generation_sec": 0,
            "avg_total_sec": 0,
            "logs": []
        }
    try:
        with open(log_filename, "r", encoding="utf-8") as f:
            logs = json.load(f)
        total_queries = len(logs)
        if total_queries == 0:
            return {"total_queries": 0, "logs": []}

        avg_retrieval = sum(l.get("retrieval_time_sec", 0) for l in logs) / total_queries
        avg_generation = sum(l.get("generation_time_sec", 0) for l in logs) / total_queries
        avg_total = sum(l.get("total_time_sec", 0) for l in logs) / total_queries

        return {
            "total_queries": total_queries,
            "avg_retrieval_sec": round(avg_retrieval, 3),
            "avg_generation_sec": round(avg_generation, 3),
            "avg_total_sec": round(avg_total, 3),
            "logs": list(reversed(logs))
        }
    except Exception as e:
        return {"error": str(e), "logs": []}


@app.post("/api/evaluate")
def run_evaluation(req: EvaluateRequest):
    """
    Runs Golden Dataset evaluation with LLM as judge.
    """
    try:
        dataset = parse_golden_dataset(req.dataset_content, model_llm=req.model_llm)
        if not dataset:
            raise HTTPException(status_code=400, detail="Could not extract QA pairs from dataset.")

        results = evaluate(
            golden_dataset=dataset,
            confidence_threshold=req.confidence_threshold,
            top_k_retrieval=req.top_k_retrieval,
            top_k_final=req.top_k_final,
            model_llm=req.model_llm,
            collection_name=req.collection_name,
            log_name=LOG_FILE.replace(".json", ""),
            model_embed=req.model_embed,
            model_judge=req.model_judge,
            reranking=req.reranking
        )

        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")


# Mount React Frontend static files if built
frontend_dist = os.path.join(os.path.dirname(__file__), "frontend", "dist")
if os.path.exists(frontend_dist):
    from fastapi.staticfiles import StaticFiles
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
