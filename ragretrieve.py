import chromadb
import requests
from flashrank import Ranker, RerankRequest
import os
from dotenv import load_dotenv
import json
from config import (
    TOP_K_RETRIEVAL, 
    TOP_K_FINAL, 
    CONFIDENCE_THRESHOLD, 
    GEMINI_MODEL_EMBEDDING, 
    CHROMA_PATH,
    TARGET_EMBEDDING_DIM
)
from llm_model import use_embed
from chroma_migration import migrate_collection_if_needed, migrate_collection, get_collection_dimension

# Download / load the FlashRank reranker model
reranker = Ranker()


def retrieve(question, confidence_threshold=CONFIDENCE_THRESHOLD, top_k_retrieval=TOP_K_RETRIEVAL, 
             top_k_final=TOP_K_FINAL, collection_name="financial_docs", model_embed=GEMINI_MODEL_EMBEDDING, 
             reranking=True):
    client = chromadb.PersistentClient(path=CHROMA_PATH)

    # 1. Compute question embedding using the unified Gemini model
    embeddings = use_embed(question, model_embed)
    if not embeddings or not embeddings[0]:
        print(f"Warning: could not generate embedding for query '{question[:40]}...' using {model_embed}")
        return [[], [], []]
    question_embedding = embeddings[0]
    q_dim = len(question_embedding)

    # 2. Get collection and verify dimension match (auto-migrating 384 -> 3072 if needed)
    try:
        collection = migrate_collection_if_needed(
            client=client,
            collection_name=collection_name,
            target_model=model_embed,
            target_dim=q_dim
        )
    except Exception as e:
        print(f"Error accessing/migrating collection '{collection_name}': {e}")
        try:
            collection = client.get_collection(collection_name)
        except Exception:
            return [[], [], []]

    # 3. Query ChromaDB collection with dimension verification and auto-heal
    doc_count = collection.count()
    if doc_count == 0:
        return [[], [], []]
    actual_top_k = min(top_k_retrieval, doc_count)

    try:
        results = collection.query(
            query_embeddings=[question_embedding],
            n_results=actual_top_k,
            include=["documents", "metadatas", "distances"]
        )
    except Exception as q_err:
        if "dimension" in str(q_err).lower():
            print(f"Dimension mismatch during query on '{collection_name}': {q_err}. Healing collection to {q_dim} dim...")
            collection = migrate_collection(client, collection_name, target_model=model_embed, target_dim=q_dim)
            results = collection.query(
                query_embeddings=[question_embedding],
                n_results=min(top_k_retrieval, collection.count()),
                include=["documents", "metadatas", "distances"]
            )
        else:
            print(f"ChromaDB query error on '{collection_name}': {q_err}")
            return [[], [], []]

    if not results or not results["documents"] or len(results["documents"][0]) == 0:
        return [[], [], []]

    top_chunks = results["documents"][0]
    top_metas = results["metadatas"][0] if "metadatas" in results and results["metadatas"] else [{} for _ in top_chunks]

    final_results = []
    test_conf_list = []
    final_metas = []

    if reranking:
        passages = []
        for i, text in enumerate(top_chunks):
            meta = top_metas[i] if i < len(top_metas) else {}
            passages.append({"id": i, "text": text, "meta": meta})

        rerank_req = RerankRequest(query=question, passages=passages)
        reranked = reranker.rerank(rerank_req)

        for r in reranked:
            test_conf_list.append({"Score": f"{r['score']:.4f}", "Text": f"{r['text'][:50]}"})

        for i in range(0, min(top_k_final, len(reranked))):
            if reranked[i]["score"] >= confidence_threshold:
                final_results.append(reranked[i]["text"])
                final_metas.append(reranked[i].get("meta", {}))
                print(f"Final chunk {i+1} | score: {reranked[i]['score']:.4f} | text: {reranked[i]['text'][:80]}")
    else:
        for i in range(0, min(top_k_final, len(top_chunks))):
            final_results.append(top_chunks[i])
            final_metas.append(top_metas[i] if i < len(top_metas) else {})
            test_conf_list.append({"Score": "n/a", "Text": f"{top_chunks[i][:50]}"})
            print(f"Final chunk {i+1} | score: n/a | text: {top_chunks[i][:80]}")

    return [final_results, test_conf_list, final_metas]