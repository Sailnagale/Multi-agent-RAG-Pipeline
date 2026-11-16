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

### 1. Prerequisites
- **Python 3.11+** installed ([python.org](https://www.python.org/downloads/))
- **Node.js 18+ or 20+** and **npm** ([nodejs.org](https://nodejs.org/))
- **Ollama** installed for offline local inference ([ollama.com](https://ollama.com/))
- *(Optional)* **Google Gemini API Key** and/or **Groq API Key** if you wish to use cloud LLMs alongside local Ollama models.

---

### 2. Environment Configuration (`.env`)
Create or verify your `.env` file in the root project directory (`C:\Promt Assignments\Promt CP\.env`):

```env
# ── Local Ollama Setup (Default) ──────────────────────────
OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL_QWEN=qwen2.5:3b                # Default local LLM
OLLAMA_MODEL_EMBED=all-minilm               # Default local embedding model

# ── Optional: Google Gemini Cloud ────────────────────────
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL_LLM=gemini-1.5-flash
GEMINI_MODEL_EMBED=gemini-embedding-001

# ── Optional: Groq Cloud (High-speed inference) ─────────
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL_LLM=openai/gpt-oss-120b

# ── Active Provider Selection (ollama | gemini | groq) ───
LLM_PRIMARY_PROVIDER=ollama
EMBED_PRIMARY_PROVIDER=ollama
ENABLE_PROVIDER_FAILOVER=true

# ── Retrieval Parameters ─────────────────────────────────
TOP_K_RETRIEVAL=10
TOP_K_FINAL=5
CONFIDENCE_THRESHOLD=0.0001
```

> **Note:** The Analyzer UI features a real-time 3-way toggle (**Ollama**, **Gemini**, **Groq**), so you can switch models at any time directly from the web interface without restarting the server!

---

### 3. Local Model Setup (Ollama)
If using local models, start the Ollama service and pull the required lightweight models:

```powershell
# In PowerShell or Terminal:
ollama serve

# In a separate terminal tab, pull the default models:
ollama pull qwen2.5:3b
ollama pull all-minilm
```

---

### 4. Backend Setup & Run (FastAPI)

1. Open PowerShell / Command Prompt and navigate to the project root:
   ```powershell
   cd "C:\Promt Assignments\Promt CP"
   ```

2. Create and activate a Python virtual environment:
   ```powershell
   # Windows PowerShell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```
   *(On Linux/macOS: `source .venv/bin/activate`)*

3. Install required Python packages:
   ```powershell
   pip install -r requirements.txt
   ```

4. Start the FastAPI backend server:
   ```powershell
   uvicorn server:app --reload --host 127.0.0.1 --port 8000
   ```
   - **Backend API**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
   - **Interactive API Documentation (Swagger)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - **System Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
   - **Runtime Config**: [http://127.0.0.1:8000/api/config](http://127.0.0.1:8000/api/config)

---

### 5. Frontend Setup & Run (React + Vite)

1. Open a new terminal tab and navigate to the `frontend` folder:
   ```powershell
   cd "C:\Promt Assignments\Promt CP\frontend"
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Launch the Vite development server:
   ```powershell
   npm run dev
   ```
   - **Frontend App URL**: [http://localhost:5173](http://localhost:5173)

---

### 6. Alternative: Production Build & Single-Port Serving
You can also compile the React frontend for production. When built, FastAPI automatically serves the static assets on port 8000:

```powershell
# Build frontend
cd "C:\Promt Assignments\Promt CP\frontend"
npm run build

# Start FastAPI server
cd "C:\Promt Assignments\Promt CP"
.\.venv\Scripts\Activate.ps1
uvicorn server:app --host 127.0.0.1 --port 8000
```
Open **[http://localhost:8000](http://localhost:8000)** directly in your browser.

---

### 7. Key Features & How to Use the App

1. **Interactive Animated Minions & Cats Login Page**:
   - Access by clicking **Log In** / **Switch Account** on the Dashboard or **Sign In** in the top navbar.
   - **4 Minions & 3 Cats** (7 characters total) react dynamically:
     - **Typing Email**: The squad's eyes follow your typing across the screen.
     - **Entering Password**: The characters cover their eyes with their hands and paws, while Stuart, Otto, and the Tuxedo cat turn and look away to the left (`🙈 "We are NOT looking!"`).
     - **Incorrect Password**: Enter an invalid password (or type `wrong`) and submit to watch the entire squad shake, cry real tears, and mourn the error.
     - **Correct Password**: Enter a valid password (or click **Instant Demo Login**) to trigger confetti, balloons, and an animated celebration dance!

2. **Executive Financial Dashboard**:
   - Displays real-time portfolio KPIs (Companies Analyzed, Average Health Score, Sentiment Distribution, Coverage Stats).
   - Filter and search past company reports, inspect full audit records, or click **New Company Analysis**.

3. **3-Way Model & Engine Toggle (Ollama Local, Gemini Cloud, Groq Cloud)**:
   - **Local Demonstration**: Ollama (`qwen2.5:3b` + `all-minilm`) for zero-cost offline demonstration.
   - **Cloud Production**: **Google Gemini** (`gemini-1.5-flash` + `gemini-embedding-001`) and **Groq** (`openai/gpt-oss-120b`) for ultra-high throughput and accurate reasoning.
   - Automatic multi-tier provider failover ensures zero 500 downtime even if an individual API quota or rate limit is encountered.

4. **Live RAG Extracted Text & Chunks Preview**:
   - Immediately upon uploading any 10-K, 10-Q, or PDF/HTML annual report, an interactive **RAG Extraction Preview** is rendered directly in the interface.
   - **Real-Time KPIs**: Extracted Page Count, Total Chunks Indexed, Total Word Count, and Total Character Count.
   - **Vector Chunk Inspector**: Filter chunks by page number, perform live full-text keyword searches across chunks, copy chunk snippets with one click, and inspect estimated token counts and full text in an inspection modal.
   - **Extracted Page Reader**: Switch view mode to review raw parsed text page-by-page to verify parsing fidelity before triggering multi-agent analysis.

5. **Executive Interactive Financial Visualizations**:
   - 5 interactive analytical graphs with end-to-end audit traceability:
     1. **Revenue & Profitability Growth Dynamics** (Multi-period revenue, gross profit, operating income, net income).
     2. **Capital Structure & Solvency Health** (Cash & equivalents, commercial paper, long-term debt, total obligations).
     3. **Profit Margin Efficiency Profile** (Gross, operating, EBITDA, and net profit margins).
     4. **Cash Flow Generation & Capital Allocation** (Operating cash flow, CapEx, free cash flow, share repurchases & dividends).
     5. **Segment & Product Contribution Breakdown** (Interactive donut pie chart and segmented contribution bars).
   - **Interactive Chart Controls**: Switch chart visualization types on-the-fly (`Bar`, `Line`, `Area`).
   - **Forensic Traceability**: Every chart includes AI forensic quantitative assessments, direct audited quotes from the filing, and clickable page reference badges.

---

### 8. Troubleshooting & Common Fixes
- **Ollama Connection Error**: Ensure the Ollama background service is running (`ollama serve`) and the models are installed (`ollama list`).
- **Port 8000 Already in Use**: Terminate previous uvicorn instances using PowerShell:
  ```powershell
  Get-Process | Where-Object { $_.ProcessName -match "uvicorn|python" } | Stop-Process -Force
  ```
- **Groq or Gemini API Key Missing**: Verify that your API keys in `.env` are set without quotes and have no duplicate keys. The system gracefully falls back to local Ollama if an API key is unconfigured.

---

## Conclusion
The project demonstrates a **full‑stack, locally‑hosted RAG solution** tailored for financial document analysis. By modularising the analysis into specialist agents and using lightweight models, we achieve fast, source‑grounded insights without external API costs. The architecture cleanly separates concerns—frontend, API, vector store, and model server—making future extensions (e.g., adding valuation agents or switching to a larger LLM) straightforward.

---

*Happy analyzing!*