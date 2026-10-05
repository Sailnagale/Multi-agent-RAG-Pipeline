# ==========================================
# CONFIGURATION SETTINGS
# ==========================================
import os
# Local Ollama Models (Default)
GEMINI_MODEL_LLM = "qwen2.5:3b"
GEMINI_MODEL_EMBEDDING = "all-minilm"

# Secondary / Fallback Embedding Models
FALLBACK_EMBEDDING_MODEL = "all-minilm"

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