import chromadb
import requests
from flashrank import Ranker, RerankRequest
import os
from dotenv import load_dotenv
import json
from config import TOP_K_RETRIEVAL, TOP_K_FINAL, CONFIDENCE_THRESHOLD, GEMINI_MODEL_EMBEDDING
from llm_model import use_embed

# Download / load the FlashRank reranker model
reranker = Ranker()


def retrieve(question, confidence_threshold=CONFIDENCE_THRESHOLD, top_k_retrieval=TOP_K_RETRIEVAL, 
             top_k_final=TOP_K_FINAL, collection_name="financial_docs", model_embed=GEMINI_MODEL_EMBEDDING, 
             reranking=True):
    client = chromadb.PersistentClient(path="./chroma_db")
    try:
        collection = client.get_collection(collection_name)
    except Exception as e:
        print(f"Collection '{collection_name}' not found: {e}")
        return [[], [], []]

    # Compute question embedding
    embeddings = use_embed(question, model_embed)
    if not embeddings:
        return [[], [], []]
    question_embedding = embeddings[0]

    # Query ChromaDB collection
    doc_count = collection.count()
    if doc_count == 0:
        return [[], [], []]
    actual_top_k = min(top_k_retrieval, doc_count)

    results = collection.query(
        query_embeddings=[question_embedding],
        n_results=actual_top_k,
        include=["documents", "metadatas", "distances"]
    )

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