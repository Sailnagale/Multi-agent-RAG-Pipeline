# Financial Report RAG System

## Overview
This repository implements a **Financial Report Retrieval‑Augmented Generation (RAG)** platform that ingests company annual reports (PDF/HTML), creates vector embeddings, and runs **five specialized analysis agents** to produce a comprehensive, source‑grounded financial overview. The backend is built with **FastAPI** and **Ollama** for local LLM and embedding inference, while the frontend is a **React** application providing a modern, responsive UI.

---

## Table of Contents
- [Architecture](#architecture)
- [Models & Prompts](#models--prompts)
- [Methodology & Workflow](#methodology--workflow)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Challenges Overcome](#challenges-overcome)
- [Running the Project](#running-the-project)
- [Conclusion](#conclusion)

---

## Architecture
```
+-------------------+      +----------------------+      +-------------------+
|   Frontend (React)| <--> |   FastAPI Backend   | <--> |  Ollama (LLM/Embed) |
+-------------------+      +----------------------+      +-------------------+
        ^  ^                     ^        ^
        |  |                     |        |
        |  |   REST API (JSON)   |        |   Local HTTP API
        |  +---------------------+        |
        |        File I/O (PDF/HTML)      |
        +---------------------------------+
```
* **Frontend** – React SPA with pages for upload, analysis, dashboard, history, and settings. UI shows progress bars, visualizations (Recharts) and allows downloading the full JSON report.
* **Backend** – FastAPI (`server.py`) exposes:
  - `POST /api/upload` – PDF/HTML ingestion → chunking → embeddings → ChromaDB collection.
  - `POST /api/analyze` – Executes the five agents, overall synthesis, and financial visualizations, then returns a single JSON record.
  - `GET /api/history` / `GET /api/history/{id}` – List and retrieve past analyses.
* **RAG Components** –
  - **Chunking** (`ragchunker.py`): splits each page into 500‑token chunks with 50‑token overlap.
  - **Embedding** (`llm_model.use_embed`): `all‑minilm` via Ollama, stored in a ChromaDB collection.
  - **Retrieval** (`ragretrieve.retrieve`): top‑k similarity search, optional cross‑encoder reranking.
* **Agents** (`agents.py`): Five domain‑specific agents (Positive, Negative, Neutral, Financial, Risk) plus an Overall Synthesis agent. Each builds a prompt, retrieves relevant chunks, calls the LLM, and returns structured JSON.
* **Persistence** – Analysis records are saved to a temporary `analysis_history.json` (outside the watched source tree) to avoid hot‑reload interruptions. Query logs go to `monitor_log.json`.

---

## Models & Prompts
| Component | Model | Reason |
|-----------|-------|--------|
| **LLM** | `qwen2.5:3b` (Ollama) | Small, fast, locally runnable; provides sufficient reasoning for our structured prompts. |
| **Embedding** | `all‑minilm` (Ollama) | Very lightweight (~50 MB) and works well with the 500‑token chunks. Replaces the heavier `nomic‑embed‑text` to keep memory ≤ 2 GB. |
| **Reranker (optional)** | `all‑minilm` (same model) | Used only when `reranking=True`; the same embedding model is re‑scored to keep the stack minimal. |

### Prompts (excerpt)
* **Positive Agent** – *“Identify strengths, growth opportunities, and positive signals for {company} in the {industry} sector.”*
* **Negative Agent** – *“List weaknesses, warning signs, and negative indicators for {company}.”*
* **Neutral Agent** – *“Provide an unbiased, evidence‑based summary of the company’s performance.”*
* **Financial Agent** – *“Extract revenue, profit, margins, debt, cash‑flow, and key financial ratios; report them with source page numbers.”*
* **Risk Agent** – *“Highlight financial, operational, market, and regulatory risks with severity levels.”*
* **Overall Synthesis** – *“Combine the five agent outputs into an executive memo, health score, verdict, sentiment breakdown, and catalyst list.”*

All prompts enforce **JSON‑only** output using a schema block (see `agents.py` for the exact schema). The `_clean_json_response` helper sanitises the LLM response before parsing.

---

## Methodology & Workflow
1. **Upload** – User selects a PDF/HTML file. The server extracts pages (`pdf_load` / `html_load`), auto‑detects a company name, and stores the document in a temporary path.
2. **Chunk & Embed** – Pages are split into overlapping chunks, each chunk is embedded with `all‑minilm`, and stored in a Chroma collection.
3. **Analysis** – When the user clicks *Run Analysis*:
   - The backend builds a `config_params` dict (thresholds, top‑k values, model names).
   - Each of the five agents runs sequentially:
     - Retrieve the most relevant chunks.
     - Build a system‑role + user‑prompt.
     - Call `use_model` (Ollama `/api/generate`).
     - Parse JSON output.
   - Overall synthesis runs on the aggregated agent results.
   - `extract_financial_visualizations` pulls numeric series (revenue, profit, cash‑flow) and returns a list of chart descriptors.
   - The full analysis record (including visualizations) is saved to `analysis_history.json` and returned to the frontend.
4. **Dashboard & History** – The frontend polls `/api/history` for a summary list and can fetch a full record via `/api/history/{id}`.
5. **Visualization** – React uses Recharts to render line/bar/pie charts; each chart is linked back to the originating page/chunk for traceability.

---

## Key Features
- **Multi‑agent specialist analysis** – Five domain‑specific agents plus an executive synthesis.
- **Source grounding** – Every fact includes the page/chunk number from the original PDF.
- **Lightweight local inference** – Ollama serves both LLM and embedding models; no external API keys needed.
- **Progress feedback** – UI shows step‑by‑step progress bars for ingestion, embedding, and each agent.
- **Persisted history** – Users can revisit past analyses, filter by company/industry, and view full JSON reports.
- **Responsive design** – Dark/light mode, animated landing page, and mobile‑friendly layouts.
- **Extensible architecture** – Adding new agents or swapping models only requires updating the prompt schema and config.

---

## Tech Stack
| Layer | Technology |
|-------|-------------|
| **Frontend** | React (Vite), TypeScript, Recharts, Lucide icons, Tailwind CSS |
| **Backend** | FastAPI, Uvicorn, Python 3.11 |
| **Vector Store** | ChromaDB (in‑process) |
| **LLM & Embeddings** | Ollama (local server) – `qwen2.5:3b` & `all‑minilm` |
| **PDF/HTML Parsing** | PyMuPDF (`fitz`), `beautifulsoup4` |
| **Data handling** | Pydantic models, UUID, datetime |
| **Deployment** | Docker optional; local Windows dev environment (PowerShell) |

---

## Challenges Overcome
1. **Memory consumption** – Switching from `nomic‑embed‑text` (≈ 800 MB) to `all‑minilm` reduced RAM usage from ~ 12 GB to < 2 GB, allowing the whole pipeline to run on a modest laptop.
2. **Hot‑reload race condition** – `uvicorn --reload` restarted the server each time the analysis log or history file was written, aborting the response. The fix moved both files to a temporary directory (outside the watched source tree) and updated the logging utility accordingly.
3. **Prompt robustness** – Initial LLM responses sometimes omitted the required JSON block. A `_clean_json_response` helper now strips any stray text and enforces schema compliance, with a graceful fallback JSON if parsing fails.
4. **Concurrent progress UI** – Implemented step‑wise timers in the React side to keep the user informed while the backend performs long‑running LLM calls.
5. **Cross‑platform path handling** – All file paths use `os.path` utilities and forward slashes (`file://`) for clickable links in the UI and documentation.

---

## Running the Project
### Prerequisites
- **Python 3.11+** (recommended via `pyenv` or Windows installer)
- **Node.js 20+** and **npm** (or `pnpm`) for the React frontend
- **Ollama** installed and running (`ollama serve`).
- Pull the required models:
  ```bash
  ollama pull qwen2.5:3b
  ollama pull all-minilm
  ```
- (Optional) Docker – the repo includes a `Dockerfile` for the backend if you prefer containerisation.

### Setup Steps
1. **Clone the repository** (already assumed in `c:\Promt Assignments\Promt CP`).
2. **Backend**
   ```powershell
   cd "C:\Promt Assignments\Promt CP"
   python -m venv .venv
   .\.venv\Scripts\activate
   pip install -r requirements.txt
   # Start FastAPI (no --reload to avoid unwanted restarts; you can use --reload now that logs are outside the source)
   uvicorn server:app --host 127.0.0.1 --port 8000
   ```
3. **Frontend**
   ```powershell
   cd frontend
   npm install   # or pnpm install
   npm run dev   # starts Vite dev server on http://localhost:5173
   ```
4. **Use the app**
   - Open `http://localhost:5173`.
   - Upload a PDF, select the industry, and click *Run Analysis*.
   - View the step‑by‑step results, visualizations, and download the JSON report.

### Testing
Run the provided pytest suite (if any) with:
```bash
pytest tests/
```
All tests should pass with the new logging locations.

---

## Conclusion
The project demonstrates a **full‑stack, locally‑hosted RAG solution** tailored for financial document analysis. By modularising the analysis into specialist agents and using lightweight models, we achieve fast, source‑grounded insights without external API costs. The architecture cleanly separates concerns—frontend, API, vector store, and model server—making future extensions (e.g., adding valuation agents or switching to a larger LLM) straightforward.

---

*Happy analyzing!*