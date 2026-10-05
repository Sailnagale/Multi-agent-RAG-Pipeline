import requests
from ragretrieve import retrieve
from prodmonitoring import log_query
import time
from dotenv import load_dotenv
import os
from google import genai
from config import GEMINI_MODEL_LLM, TOP_K_RETRIEVAL, TOP_K_FINAL, CONFIDENCE_THRESHOLD, GEMINI_MODEL_EMBEDDING
from llm_model import use_model


def ask(question, confidence_threshold=CONFIDENCE_THRESHOLD, top_k_retrieval=TOP_K_RETRIEVAL, top_k_final=TOP_K_FINAL,
        model_llm=GEMINI_MODEL_LLM, collection_name="financial_docs", log_name="monitor_log", model_embed=GEMINI_MODEL_EMBEDDING, 
        reranking=True):
    
    # Time logging for retrieving chunks
    start_time_chunks = time.time()
    # Retrieve the relevant chunks
    chunks_and_scores = retrieve(question, confidence_threshold=confidence_threshold, top_k_retrieval=top_k_retrieval,
                                  top_k_final=top_k_final, collection_name=collection_name, model_embed=model_embed, reranking=reranking)

    chunks = chunks_and_scores[0]

    # If due to confidence threshold can't find anything
    if not chunks:
        return f"Could not find relevant information in document to answer question (Confidence Threshold={confidence_threshold}). Scores of nearest relevant clusters are {chunks_and_scores[1]}"
    else:
        print(f"(Threshold={confidence_threshold}, nearest cluster scores are {chunks_and_scores[1]})")


    retrieval_time = time.time() - start_time_chunks
    context = "\n\n".join(chunks)

    # Prompt engineering
    prompt = f"""Act as a financial assistant to help beginner investors interpret financial reports to make investment decisions. 
    Use ONLY the context below to answer the question. If the answer is not in the context, say "I couldn't find that in the document."
    Explain in simple terms a beginner investor would understand.

    Context: {context}
    Question: {question}

    Answer:"""

    # Step 3: send to Qwen via Ollama
    # Time logging for response from LLM
    start_time_llm = time.time()

    
    response = use_model(prompt, model_llm)

    generation_time = time.time() - start_time_llm

    if (model_llm == "gemini-3.8-flash"):
        log_query(question, response.output_text, chunks, retrieval_time, generation_time, response.usage.total_input_tokens, 
              response.usage.total_output_tokens, log_name=log_name)
        return response.output_text
    else:
        log_query(question, response["response"], chunks, retrieval_time, generation_time, response["prompt_eval_count"], 
              response["eval_count"], log_name=log_name)
        return response["response"]

    

# test it
# question = "Should I invest in apple based on the financial statements?"
# answer = ask(question)
# print(f"Q: {question}")
# print(f"\nA: {answer}")