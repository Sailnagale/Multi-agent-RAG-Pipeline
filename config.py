# ==========================================
# CONFIGURATION SETTINGS
# ==========================================
import os
import tempfile
import shutil

# Default Cloud & Local Models
GEMINI_MODEL_LLM = "gemini-3.5-flash"
GEMINI_MODEL_EMBEDDING = "gemini-embedding-001"
TARGET_EMBEDDING_DIM = 3072

# Secondary / Fallback Embedding Models
FALLBACK_EMBEDDING_MODEL = "all-minilm"

# Chroma storage path: store in system temp or designated external directory to prevent watchfiles reloader from restarting uvicorn during analysis
CHROMA_PATH = os.environ.get("CHROMA_DB_PATH", os.path.join(tempfile.gettempdir(), "financial_rag_chroma_db"))

# Automatically migrate existing local chroma_db if temp folder does not exist
_local_chroma = os.path.abspath("./chroma_db")
if os.path.exists(_local_chroma) and not os.path.exists(CHROMA_PATH):
    try:
        shutil.copytree(_local_chroma, CHROMA_PATH)
    except Exception:
        pass

# Chunking setup
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

# Retrieval setup
# Grab a few extra chunks first, then rerank down to the best ones
TOP_K_RETRIEVAL = 10
TOP_K_FINAL = 3

# Threshold of confidence to which we accept a chunk
CONFIDENCE_THRESHOLD = 0.0001

# Where query logs get saved
LOG_FILE = os.path.join(os.getenv('TMP', os.path.abspath('.')), "monitor_log.json")

# Batch size set for Chroma ingestion
BATCH_SIZE = 100

# Supported Industries
INDUSTRIES = [
    "IT",
    "Banking",
    "Finance",
    "Insurance",
    "Healthcare",
    "Pharmaceuticals",
    "Agriculture",
    "Automotive",
    "Manufacturing",
    "Energy",
    "Retail",
    "Telecommunications",
    "Real Estate",
    "FMCG",
    "Logistics",
    "Mining",
    "Chemicals",
    "Infrastructure",
    "Media & Entertainment",
    "Other"
]

# History File
import os
HISTORY_DIR = os.path.join(os.getenv('TMP', os.path.abspath('.')), "analysis_history")
os.makedirs(HISTORY_DIR, exist_ok=True)
HISTORY_FILE = os.path.join(HISTORY_DIR, "analysis_history.json")