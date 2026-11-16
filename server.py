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
from fastapi.responses import JSONResponse, StreamingResponse
import concurrent.futures
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
    HISTORY_FILE,
    CHROMA_PATH
)
from ingestpdf import create_embedding_index, pdf_load, html_load, chunking_text
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

# In-memory store for document extraction previews
DOC_PREVIEWS: Dict[str, Any] = {}

# Initialize FastAPI App
app = FastAPI(
    title="Financial Report RAG & Multi-Agent Intelligence API",
    description="Backend API powering the 5-Agent Financial Analysis Platform",
    version="2.0.0"
)

from chroma_migration import migrate_all_collections, migrate_collection_if_needed

@app.on_event("startup")
def startup_migration_check():
    """
    Checks all ChromaDB collections on startup:
    Auto-aligns any collections with legacy 384 dimensions to 3072 dimensions matching Gemini.
    Skips collections that are already 3072 dimensions without unnecessary regeneration.
    """
    print("--> [Startup] Checking ChromaDB collection embedding dimensions...")
    try:
        summary = migrate_all_collections()
        migrated_count = len(summary.get("migrated", []))
        skipped_count = len(summary.get("skipped", []))
        print(f"--> [Startup] ChromaDB dimension alignment check complete: {migrated_count} migrated to 3072, {skipped_count} already matching.")
    except Exception as e:
        print(f"--> [Startup] ChromaDB migration check warning: {e}")

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
        r = requests.get("http://localhost:11434/api/tags", timeout=0.5)
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


from runtime_config import get as cfg_get, set_ as cfg_set, all as cfg_all

@app.get("/api/config")
def get_config():
    return {
        "model_llm": cfg_get("LLM_MODEL") or GEMINI_MODEL_LLM,
        "model_embed": cfg_get("EMBED_MODEL") or GEMINI_MODEL_EMBEDDING,
        "llm_provider": cfg_get("LLM_PRIMARY_PROVIDER") or "ollama",
        "embed_provider": cfg_get("EMBED_PRIMARY_PROVIDER") or "ollama",
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        "top_k_retrieval": TOP_K_RETRIEVAL,
        "top_k_final": TOP_K_FINAL,
        "chunk_size": CHUNK_SIZE,
        "chunk_overlap": CHUNK_OVERLAP,
        "industries": INDUSTRIES
    }

@app.patch("/api/config")
def patch_config(update: ConfigUpdateRequest):
    if update.model_llm:
        cfg_set("LLM_MODEL", update.model_llm)
        if "gemini" in update.model_llm.lower():
            cfg_set("LLM_PRIMARY_PROVIDER", "gemini")
        elif "groq" in update.model_llm.lower() or "llama" in update.model_llm.lower():
            cfg_set("LLM_PRIMARY_PROVIDER", "groq")
        else:
            cfg_set("LLM_PRIMARY_PROVIDER", "ollama")
    if update.model_embed:
        cfg_set("EMBED_MODEL", update.model_embed)
        if "gemini" in update.model_embed.lower():
            cfg_set("EMBED_PRIMARY_PROVIDER", "gemini")
        else:
            cfg_set("EMBED_PRIMARY_PROVIDER", "ollama")
    return {
        "status": "ok",
        "config": get_config()
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

        # Compute RAG chunks & pages summary for instant preview
        all_chunks = chunking_text(pages, chunk_size, chunk_overlap)
        total_words = sum(len(p.get("text", "").split()) for p in pages)
        total_chars = sum(len(p.get("text", "")) for p in pages)
        
        pages_summary = []
        for p in pages:
            p_text = p.get("text", "").strip()
            pages_summary.append({
                "page": p.get("page_number", 1),
                "words": len(p_text.split()),
                "char_count": len(p_text),
                "snippet": (p_text[:160] + "...") if len(p_text) > 160 else p_text
            })

        chunks_preview = []
        for idx, ch in enumerate(all_chunks):
            ch_text = ch.get("text", "").strip()
            chunks_preview.append({
                "chunk_index": idx + 1,
                "page": ch.get("page_number", 1),
                "word_count": len(ch_text.split()),
                "char_count": len(ch_text),
                "snippet": (ch_text[:180] + "...") if len(ch_text) > 180 else ch_text,
                "text": ch_text
            })

        preview_payload = {
            "filename": file.filename,
            "collection_name": collection_name,
            "page_count": page_count,
            "num_chunks": len(all_chunks),
            "total_words": total_words,
            "total_chars": total_chars,
            "detected_company": detected_company,
            "pages_summary": pages_summary,
            "chunks_preview": chunks_preview[:120],  # first 120 chunks for ultra-fast frontend rendering
            "sample_text": sample_text[:1200]
        }
        DOC_PREVIEWS[collection_name] = preview_payload

        return {
            "status": "success",
            "filename": file.filename,
            "collection_name": collection_name,
            "page_count": page_count,
            "num_chunks": len(all_chunks),
            "total_words": total_words,
            "total_chars": total_chars,
            "detected_company": detected_company,
            "pages_summary": pages_summary,
            "chunks_preview": chunks_preview[:120],
            "message": f"Successfully ingested {file.filename}: {page_count} pages, {len(all_chunks)} chunks indexed."
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to ingest file: {str(e)}")
    finally:
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass


@app.get("/api/document/preview/{collection_name}")
def get_document_preview(collection_name: str):
    """
    Returns the RAG text and chunk extraction preview for any uploaded collection.
    """
    if collection_name in DOC_PREVIEWS:
        return DOC_PREVIEWS[collection_name]
    
    # Fallback to querying ChromaDB directly if collection exists in Chroma
    try:
        client = chromadb.PersistentClient(path=CHROMA_PATH)
        col = client.get_collection(collection_name)
        data = col.get(limit=100, include=["documents", "metadatas"])
        docs = data.get("documents", [])
        metas = data.get("metadatas", [])
        chunks_preview = []
        for i, (doc, meta) in enumerate(zip(docs, metas)):
            chunks_preview.append({
                "chunk_index": i + 1,
                "page": meta.get("page", 1) if meta else 1,
                "word_count": len(doc.split()),
                "char_count": len(doc),
                "snippet": (doc[:180] + "...") if len(doc) > 180 else doc,
                "text": doc
            })
        return {
            "collection_name": collection_name,
            "page_count": max([c["page"] for c in chunks_preview], default=1),
            "num_chunks": len(chunks_preview),
            "total_words": sum(c["word_count"] for c in chunks_preview),
            "total_chars": sum(c["char_count"] for c in chunks_preview),
            "chunks_preview": chunks_preview
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Preview not available: {str(e)}")


@app.post("/api/analyze")
def analyze_report(req: AnalyzeRequest):
    """
    Executes the 5 Specialized Agents in parallel:
    1. Positive Agent (strengths, growth, opportunities)
    2. Negative Agent (weaknesses, warning signs, negative indicators)
    3. Neutral Agent (unbiased evidence-based summary)
    4. Financial Agent (revenue, profit, margins, debt, cash flow, financial ratios)
    5. Risk Agent (financial, operational, market, regulatory risks)
    Plus Overall Company Analysis & Instant Financial Visualizations from extracted metrics.
    """
    start_time = time.time()
    active_llm = req.model_llm or cfg_get("LLM_MODEL") or GEMINI_MODEL_LLM
    active_embed = req.model_embed or cfg_get("EMBED_MODEL") or GEMINI_MODEL_EMBEDDING
    config_params = {
        "confidence_threshold": req.confidence_threshold,
        "top_k_retrieval": req.top_k_retrieval,
        "top_k_final": req.top_k_final,
        "model_llm": active_llm,
        "model_embed": active_embed,
        "collection_name": req.collection_name,
        "reranking": req.reranking
    }

    try:
        # Run 5 Agents concurrently in parallel using ThreadPoolExecutor
        print(f"--> Executing all 5 Specialized Agents in parallel for {req.company_name}...")
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            fut_pos = executor.submit(run_positive_agent, req.company_name, req.industry, req.collection_name, config_params)
            fut_neg = executor.submit(run_negative_agent, req.company_name, req.industry, req.collection_name, config_params)
            fut_neu = executor.submit(run_neutral_agent, req.company_name, req.industry, req.collection_name, config_params)
            fut_fin = executor.submit(run_financial_agent, req.company_name, req.industry, req.collection_name, config_params)
            fut_risk = executor.submit(run_risk_agent, req.company_name, req.industry, req.collection_name, config_params)

            positive_res = fut_pos.result()
            negative_res = fut_neg.result()
            neutral_res = fut_neu.result()
            financial_res = fut_fin.result()
            risk_res = fut_risk.result()

        # Run Overall Synthesis
        agent_bundle = {
            "positive": positive_res,
            "negative": negative_res,
            "neutral": neutral_res,
            "financial": financial_res,
            "risk": risk_res
        }
        print(f"--> Running Overall Synthesis for {req.company_name}...")
        overall_res = run_overall_synthesis(req.company_name, req.industry, agent_bundle, model_llm=active_llm)

        # Extract Financial Visualizations instantly from Financial Agent findings (no slow LLM / image generation calls)
        print(f"--> Formatting Structured Financial Visualizations for {req.company_name}...")
        charts_res = extract_financial_visualizations(
            req.company_name, req.industry, req.collection_name, config_params,
            financial_res=financial_res
        )

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
        try:
            history = _load_history()
            history.insert(0, analysis_record)
            _save_history(history)
        except Exception as eh:
            print(f"Error saving history record: {eh}")

        return analysis_record

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/api/analyze/stream")
def analyze_report_stream(req: AnalyzeRequest):
    """
    Streams the 5 specialized agents progressively using Server-Sent Events (SSE).
    Emits events as soon as each agent produces its output, then streams visualizations,
    synthesis, and the final combined analysis record.
    """
    def event_generator():
        start_time = time.time()
        active_llm = req.model_llm or cfg_get("LLM_MODEL") or GEMINI_MODEL_LLM
        active_embed = req.model_embed or cfg_get("EMBED_MODEL") or GEMINI_MODEL_EMBEDDING
        config_params = {
            "confidence_threshold": req.confidence_threshold,
            "top_k_retrieval": req.top_k_retrieval,
            "top_k_final": req.top_k_final,
            "model_llm": active_llm,
            "model_embed": active_embed,
            "collection_name": req.collection_name,
            "reranking": req.reranking
        }

        # 1. Emit start event
        yield f"data: {json.dumps({'type': 'start', 'company': req.company_name, 'message': 'Starting multi-agent analysis...'})}\n\n"

        agent_results = {}
        # Run 5 agents concurrently and emit outputs as soon as each completes
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            future_to_agent = {
                executor.submit(run_positive_agent, req.company_name, req.industry, req.collection_name, config_params): "positive",
                executor.submit(run_negative_agent, req.company_name, req.industry, req.collection_name, config_params): "negative",
                executor.submit(run_neutral_agent, req.company_name, req.industry, req.collection_name, config_params): "neutral",
                executor.submit(run_financial_agent, req.company_name, req.industry, req.collection_name, config_params): "financial",
                executor.submit(run_risk_agent, req.company_name, req.industry, req.collection_name, config_params): "risk",
            }

            for future in concurrent.futures.as_completed(future_to_agent):
                agent_name = future_to_agent[future]
                try:
                    res = future.result()
                    agent_results[agent_name] = res
                    # Immediately yield completed agent result to client!
                    yield f"data: {json.dumps({'type': 'agent_complete', 'agent': agent_name, 'data': res})}\n\n"
                except Exception as e:
                    print(f"Error in {agent_name} agent: {e}")
                    agent_results[agent_name] = {"summary": f"Completed with fallback {agent_name} analysis.", "findings": []}
                    yield f"data: {json.dumps({'type': 'agent_complete', 'agent': agent_name, 'data': agent_results[agent_name]})}\n\n"

        # 2. Extract financial visualizations (instant, deterministic)
        charts_res = extract_financial_visualizations(
            req.company_name, req.industry, req.collection_name, config_params,
            financial_res=agent_results.get("financial")
        )
        yield f"data: {json.dumps({'type': 'visualizations_complete', 'data': charts_res})}\n\n"

        # 3. Run Overall Synthesis
        overall_res = run_overall_synthesis(req.company_name, req.industry, agent_results, model_llm=active_llm)
        yield f"data: {json.dumps({'type': 'overall_complete', 'data': overall_res})}\n\n"

        total_duration = round(time.time() - start_time, 2)
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
            "agents": agent_results,
            "visualizations": charts_res
        }

        # Persist to history
        try:
            history = _load_history()
            history.insert(0, analysis_record)
            _save_history(history)
        except Exception:
            pass

        yield f"data: {json.dumps({'type': 'done', 'record': analysis_record})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


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
