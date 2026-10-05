import json
import time
from datetime import datetime
from config import LOG_FILE

def log_query(question, answer, chunks, retrieval_time, generation_time, input_tokens, output_tokens, log_name="monitor_log"):
    """Log a query and its metadata to the monitor log file.
    The log is written to the path defined by LOG_FILE (outside the watched project directory).
    """
    json_entry = {
        "timestamp": datetime.now().isoformat(),
        "question": question,
        "answer": answer,
        "chunks_retrieved": chunks,
        "retrieval_time_sec": round(retrieval_time, 3),
        "generation_time_sec": round(generation_time, 3),
        "total_time_sec": round(retrieval_time + generation_time, 3),
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
    }

    # Load existing log if present
    try:
        with open(LOG_FILE, "r") as f:
            log = json.load(f)
    except Exception:
        log = []

    log.append(json_entry)

    # Write back to LOG_FILE
    with open(LOG_FILE, "w") as f:
        json.dump(log, f, indent=1)