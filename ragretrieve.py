import chromadb
import requests
from flashrank import Ranker, RerankRequest
from google import genai
import os
from dotenv import load_dotenv
import json
from config import TOP_K_RETRIEVAL, TOP_K_FINAL, CONFIDENCE_THRESHOLD, GEMINI_MODEL_EMBEDDING
from llm_model import use_embed


# Download the reranker model
reranker = Ranker()


def retrieve(question, confidence_threshold=CONFIDENCE_THRESHOLD, top_k_retrieval=TOP_K_RETRIEVAL, 
             top_k_final=TOP_K_FINAL, collection_name="financial_docs", model_embed=GEMINI_MODEL_EMBEDDING, 
             reranking=True):
    client = chromadb.PersistentClient(path="./chroma_db")
    collection = client.get_collection(collection_name)

    # remember embed is now returning a list
    question_embedding = use_embed(question, model_embed)[0]
    # Instead of 3-NN we get 10-NN first
    results = collection.query(
        query_embeddings=[question_embedding],
        n_results=top_k_retrieval
    )

    # Note that passages takes in a dictionary of format "text: content"
    # So here we convert to that dictionary formaat

    if reranking:
        top_ten_chunks = results["documents"][0] 
        top_ten_chunks_flashrank = []
        for message in top_ten_chunks:
            top_ten_chunks_flashrank.append({"text": message})
        # Now use flash rank to re-rank
        rerank_req = RerankRequest(query=question, passages=top_ten_chunks_flashrank)

        # Put those top 3 into a new list
        reranked = reranker.rerank(rerank_req)
        test_conf_list = []

        # Print out confidence scores
        for r in reranked:
            print(f"Score: {r['score']:.4f} | Text: {r['text'][:50]}")
            test_conf_list.append({"Score": f"{r['score']:.4f}", "Text": f"{r['text'][:50]}"})

        # Now take the top 3 chunks from the reranked
        final_results = []

        # Potential that collection has fewer chunks than top_k_retrievall
        for i in range(0, min(top_k_final, len(reranked))):
            if reranked[i]["score"] >= confidence_threshold:
                final_results.append(reranked[i]["text"])
                print(f"Final chunk {i+1} | score: {reranked[i]['score']:.4f} | text: {reranked[i]['text'][:80]}")
    else:
        # No reranking, so we just keep the raw KNN order straight from chroma
        top_ten_chunks = results["documents"][0]

        test_conf_list = []
        final_results = []

        # No flashrank scores exist here, so confidence threshold does not apply
        # Potential that collection has fewer chunks than top_k_final
        for i in range(0, min(top_k_final, len(top_ten_chunks))):
            final_results.append(top_ten_chunks[i])
            test_conf_list.append({"Score": "n/a", "Text": f"{top_ten_chunks[i][:50]}"})
            print(f"Final chunk {i+1} | score: n/a | text: {top_ten_chunks[i][:80]}")

    
    return [final_results, test_conf_list]

# testing
# question = "Should I invest in Apple?"
# chunks = retrieve(question)

# print(f"Question: {question}\n")
# print("Top matching chunks:")
# for i, chunk in enumerate(chunks):
#     print(f"\n--- Chunk {i+1} ---")
#     print(chunk)